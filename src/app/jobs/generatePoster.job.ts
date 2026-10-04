import config from "@/config";
import { posterRepository } from "../modules/poster/poster.repository";
import { generationService } from "../modules/generation/generation.service";
import { renderPosterToPng } from "../renderer/render.service";
import { uploadBuffer, deleteAssetById } from "../lib/cloudinary";
import type { PosterFormData } from "../modules/poster/poster.interface";

function toUserSafeMessage(err: unknown): string {
  if (!(err instanceof Error)) return "Generation failed. Please try again.";

  const msg = err.message;

  if (
    msg.includes("PrismaClientValidationError") ||
    msg.includes("PrismaClientKnownRequestError") ||
    msg.includes("PrismaClientInitializationError") ||
    msg.includes("Invalid `prisma.")
  ) {
    return "Poster generation failed due to a data error. Please try again.";
  }

  // Common, meaningful cases we DO want to surface
  if (/timeout/i.test(msg)) return "Generation timed out. Please try again.";
  if (/quota|rate/i.test(msg)) return "Service is busy. Please try again shortly.";
  if (/cloudinary/i.test(msg)) return "Image upload failed. Please try again.";
  if (/gemini/i.test(msg)) return "AI service unavailable. Please try again.";

  // Fallback — first line only, no stack traces, no file paths
  const firstLine = msg.split("\n")[0]?.trim() ?? "Generation failed";
  return firstLine.slice(0, 200);
}

export async function runPosterGeneration(posterId: string): Promise<void> {
  const started = Date.now();
  console.log(`🎨 [job] starting poster ${posterId}`);

  try {
    const poster = await posterRepository.findById(posterId);
    if (!poster) {
      console.warn(`🎨 [job] poster ${posterId} not found — aborting`);
      return;
    }
    if (!poster.template) {
      await posterRepository.markFailed(posterId, "Template no longer exists");
      return;
    }

    const previousPublicId = poster.generatedImagePublicId ?? null;

    const formData = poster.formData as unknown as PosterFormData;
    const layoutConfig = poster.template.layoutConfig as {
      colorScheme: {
        primary: string;
        accent: string;
        text: string;
        background: string;
      };
      photoSlots: unknown;
    };

    const { layout, latencyMs, tokensUsed, promptUsed } =
      await generationService.resolveLayout({
        occasionType: poster.template.occasionType,
        headline: formData.headline,
        photoCount: poster.uploadedPhotoUrls.length,
        templateDefaults: {
          ...layoutConfig.colorScheme,
          photoSlots: layoutConfig.photoSlots,
        },
      });

    console.log(`🎨 [job] layout source = ${layout.source}`);

    await posterRepository.saveLayout(posterId, layout);

    const renderStart = Date.now();
    const png = await renderPosterToPng({
      htmlTemplateKey: poster.template.htmlTemplateKey,
      headline: formData.headline,
      subheadline: formData.subheadline,
      slogan: formData.slogan,
      tribute: formData.tribute,
      name: formData.name,
      designation: formData.designation,
      party: formData.party,
      district: formData.district,
      photoUrls: poster.uploadedPhotoUrls,
      palette: layout.palette,
      headlineStyle: layout.headlineStyle,
      photoCrops: layout.photoCrops,
      decorations: layout.decorations,
    });
    const renderMs = Date.now() - renderStart;
    console.log(`🎨 [job] rendered in ${renderMs}ms`);

    const uploaded = await uploadBuffer(png, {
      folder: `${config.cloudinary_folder}/posters/${poster.userId}`,
      publicId: `poster_${posterId}_${Date.now()}`,
    });

    console.log(`🎨 [job] uploaded → ${uploaded.secure_url}`);

    await posterRepository.markCompleted(
      posterId,
      uploaded.secure_url,
      uploaded.public_id,
      {
        prompt: promptUsed,
        latencyMs,
        tokensUsed,
        renderMs,
      },
    );

    if (previousPublicId && previousPublicId !== uploaded.public_id) {
      deleteAssetById(previousPublicId)
        .then((ok) => {
          if (ok) {
            console.log(`🗑️  [job] removed previous PNG: ${previousPublicId}`);
          } else {
            console.warn(
              `⚠️  [job] could not remove previous PNG: ${previousPublicId}`,
            );
          }
        })
        .catch((err) => {
          console.warn(
            `⚠️  [job] cleanup error for ${previousPublicId}:`,
            err instanceof Error ? err.message : err,
          );
        });
    }

    console.log(
      `🎨 [job] ✅ poster ${posterId} completed in ${Date.now() - started}ms`,
    );
  } catch (err) {
    const userMessage = toUserSafeMessage(err);
    const fullMessage =
      err instanceof Error ? err.stack ?? err.message : String(err);

    console.error(`🎨 [job] ❌ poster ${posterId} failed:`);
    console.error(fullMessage);

    try {
      await posterRepository.markFailed(posterId, userMessage);
    } catch (dbErr) {
      console.error(`🎨 [job] failed to mark poster FAILED:`, dbErr);
    }
  }
}
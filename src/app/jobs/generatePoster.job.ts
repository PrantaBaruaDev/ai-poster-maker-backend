import config from "@/config";
import { posterRepository } from "../modules/poster/poster.repository";
import { generationService } from "../modules/generation/generation.service";
import { renderPosterToPng } from "../renderer/render.service";
import { uploadBuffer } from "../lib/cloudinary";
import type { PosterFormData } from "../modules/poster/poster.interface";

/**
 * Async poster generation. Fire-and-forget from the controller.
 * Never throws — always terminates with status COMPLETED or FAILED.
 */
export async function runPosterGeneration(posterId: string): Promise<void> {
  const started = Date.now();
  console.log(`🎨 [job] starting poster ${posterId}`);

  try {
    // 1. Load poster + template
    const poster = await posterRepository.findById(posterId);
    if (!poster) {
      console.warn(`🎨 [job] poster ${posterId} not found — aborting`);
      return;
    }
    if (!poster.template) {
      await posterRepository.markFailed(posterId, "Template no longer exists");
      return;
    }

    // 2. Resolve layout (Gemini or fallback)
    const formData = poster.formData as unknown as PosterFormData;
    const layoutConfig = poster.template.layoutConfig as {
      colorScheme: { primary: string; accent: string; text: string; background: string };
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

    // 3. Persist resolved layout for audit/history
    await posterRepository.saveLayout(posterId, layout);

    // 4. Render PNG
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
        // ↓ NEW — wire Gemini's output through
        headlineStyle: layout.headlineStyle,
        photoCrops: layout.photoCrops,
        decorations: layout.decorations,
    });
    const renderMs = Date.now() - renderStart;
    console.log(`🎨 [job] rendered in ${renderMs}ms`);

    // 5. Upload PNG to Cloudinary
    const uploaded = await uploadBuffer(png, {
      folder: `${config.cloudinary_folder}/posters/${poster.userId}`,
      publicId: `poster_${posterId}_${Date.now()}`,
    });

    console.log(`🎨 [job] uploaded → ${uploaded.secure_url}`);

    // 6. Mark COMPLETED + log
    await posterRepository.markCompleted(posterId, uploaded.secure_url, {
      prompt: promptUsed,
      latencyMs,
      tokensUsed,
      renderMs,
    });

    console.log(
      `🎨 [job] ✅ poster ${posterId} completed in ${Date.now() - started}ms`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`🎨 [job] ❌ poster ${posterId} failed:`, message);

    try {
      await posterRepository.markFailed(posterId, message.slice(0, 500));
    } catch (dbErr) {
      console.error(`🎨 [job] failed to mark poster FAILED:`, dbErr);
    }
  }
}
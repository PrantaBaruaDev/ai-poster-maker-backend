import config from "@/config";
import { ApiError } from "../../errors/ApiError";
import { posterRepository } from "./poster.repository";
import { templateRepository } from "../template/template.repository";
import { runPosterGeneration } from "../../jobs/generatePoster.job";
import type {
  CreatePosterBody,
  RegenerateBody,
} from "./poster.interface";
import { deleteAssetsByIds } from "../../lib/cloudinary";

export const posterService = {
  async create(userId: string, input: CreatePosterBody) {
    const template = await templateRepository.findActiveById(input.templateId);
    if (!template) throw new ApiError(404, "Template not found or inactive");

    const layoutConfig = template.layoutConfig as {
      photoSlots?: unknown[];
    };
    const maxSlots = layoutConfig.photoSlots?.length ?? config.max_photos_per_poster;
    if (input.photoUrls.length > maxSlots) {
      throw new ApiError(
        400,
        `This template accepts at most ${maxSlots} photo(s)`,
      );
    }

    const poster = await posterRepository.create({
      userId,
      templateId: input.templateId,
      formData: input.formData,
      photoUrls: input.photoUrls,
      photoPublicIds: input.photoPublicIds,
    });

    void runPosterGeneration(poster.id);

    return { posterId: poster.id, status: poster.status };
  },

  async getById(userId: string, posterId: string, isAdmin = false) {
    const poster = isAdmin
      ? await posterRepository.findById(posterId)
      : await posterRepository.findByIdForUser(posterId, userId);

    if (!poster) throw new ApiError(404, "Poster not found");

    return {
      id: poster.id,
      status: poster.status,
      generatedImageUrl: poster.generatedImageUrl,
      retryCount: poster.retryCount,
      errorMessage: poster.errorMessage,
      formData: poster.formData,
      template: poster.template
        ? {
            id: poster.template.id,
            title: poster.template.title,
            occasionType: poster.template.occasionType,
          }
        : undefined,
    };
  },

  async history(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const { items, total } = await posterRepository.history(userId, skip, limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async regenerate(
    userId: string,
    posterId: string,
    input: RegenerateBody,
  ) {
    const result = await posterRepository.tryStartRegenerate(
      posterId,
      userId,
      config.max_retries,
      input.formData,
    );

    if (result.count === 0) {
      const poster = await posterRepository.findByIdForUser(posterId, userId);
      if (!poster) throw new ApiError(404, "Poster not found");
      if (poster.status === "GENERATING") {
        throw new ApiError(409, "Poster is already generating");
      }
      throw new ApiError(
        429,
        `Maximum retries (${config.max_retries}) reached for this poster`,
      );
    }

    void runPosterGeneration(posterId);

    return { posterId, status: "GENERATING" as const };
  },

  async delete(userId: string, posterId: string, isAdmin = false) {
    const poster = isAdmin
      ? await posterRepository.findById(posterId)
      : await posterRepository.findByIdForUser(posterId, userId);

    if (!poster) throw new ApiError(404, "Poster not found");

    const publicIds: string[] = [];
    if (poster.generatedImagePublicId) {
      publicIds.push(poster.generatedImagePublicId);
    }
    if (poster.uploadedPhotoPublicIds?.length) {
      publicIds.push(...poster.uploadedPhotoPublicIds);
    }

    const result = isAdmin
      ? await posterRepository.deleteById(posterId)
      : await posterRepository.deleteForUser(posterId, userId);

    if (result.count === 0) throw new ApiError(404, "Poster not found");

    if (publicIds.length > 0) {
      const { deleted, failed } = await deleteAssetsByIds(publicIds);
      console.log(
        ` - Poster ${posterId} deleted — Cloudinary: ${deleted} removed, ${failed} failed`,
      );
    }
  },
};
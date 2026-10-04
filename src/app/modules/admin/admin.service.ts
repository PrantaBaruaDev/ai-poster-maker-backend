import { ApiError } from "../../errors/ApiError";
import { adminRepository } from "./admin.repository";
import type {
  CreateTemplateBody,
  ListPostersQuery,
  UpdateTemplateBody,
} from "./admin.interface";
import { deleteAssetsByIds } from "@/app/lib/cloudinary";

export const adminService = {
  listTemplates: () => adminRepository.listTemplates(),

  async createTemplate(input: CreateTemplateBody) {
    const existing = await adminRepository
      .listTemplates()
      .then((list) => list.find((t) => t.slug === input.slug));

    if (existing) {
      throw new ApiError(409, `Template slug "${input.slug}" already exists`);
    }

    return adminRepository.createTemplate(input);
  },

  async updateTemplate(id: string, input: UpdateTemplateBody) {
    const template = await adminRepository.findTemplateById(id);
    if (!template) throw new ApiError(404, "Template not found");

    return adminRepository.updateTemplate(id, input);
  },

  async deactivateTemplate(id: string) {
    const template = await adminRepository.findTemplateById(id);
    if (!template) throw new ApiError(404, "Template not found");
    if (!template.isActive) {
      throw new ApiError(400, "Template is already inactive");
    }
    return adminRepository.softDeleteTemplate(id);
  },

  async listPosters(query: ListPostersQuery) {
    const skip = (query.page - 1) * query.limit;
    const { items, total } = await adminRepository.listPosters({
      flagged: query.flagged,
      skip,
      take: query.limit,
    });

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  },

  async setPosterFlag(id: string, isFlagged: boolean) {
    const poster = await adminRepository.findPosterById(id);
    if (!poster) throw new ApiError(404, "Poster not found");

    if (poster.isFlagged === isFlagged) {
      throw new ApiError(
        400,
        `Poster is already ${isFlagged ? "flagged" : "unflagged"}`,
      );
    }

    return adminRepository.setFlag(id, isFlagged);
  },

  async deletePoster(id: string) {
    const poster = await adminRepository.findPosterById(id);
    if (!poster) throw new ApiError(404, "Poster not found");

    const publicIds: string[] = [];
    if (poster.generatedImagePublicId) {
      publicIds.push(poster.generatedImagePublicId);
    }
    if (poster.uploadedPhotoPublicIds?.length) {
      publicIds.push(...poster.uploadedPhotoPublicIds);
    }

    await adminRepository.deletePosterById(id);

    if (publicIds.length > 0) {
      const { deleted, failed } = await deleteAssetsByIds(publicIds);
      console.log(
        `Admin deleted poster ${id} — Cloudinary: ${deleted} removed, ${failed} failed`,
      );
    }
  }
};
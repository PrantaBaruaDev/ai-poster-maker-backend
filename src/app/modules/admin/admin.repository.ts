import { prisma } from "../../lib/prisma";
import type {
  CreateTemplateBody,
  UpdateTemplateBody,
} from "./admin.interface";

export const adminRepository = {
  listTemplates: () =>
    prisma.template.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { posters: true } },
      },
    }),

  createTemplate: (data: CreateTemplateBody) =>
    prisma.template.create({
      data: {
        slug: data.slug,
        title: data.title,
        occasionType: data.occasionType,
        thumbnailUrl: data.thumbnailUrl,
        htmlTemplateKey: data.htmlTemplateKey,
        layoutConfig: data.layoutConfig as object,
        isActive: data.isActive ?? true,
      },
    }),

  updateTemplate: (id: string, data: UpdateTemplateBody) =>
    prisma.template.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.occasionType !== undefined && { occasionType: data.occasionType }),
        ...(data.thumbnailUrl !== undefined && { thumbnailUrl: data.thumbnailUrl }),
        ...(data.htmlTemplateKey !== undefined && {
          htmlTemplateKey: data.htmlTemplateKey,
        }),
        ...(data.layoutConfig !== undefined && {
          layoutConfig: data.layoutConfig as object,
        }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    }),

  findTemplateById: (id: string) =>
    prisma.template.findUnique({
      where: { id },
      include: { _count: { select: { posters: true } } },
    }),

  softDeleteTemplate: (id: string) =>
    prisma.template.update({
      where: { id },
      data: { isActive: false },
    }),

  listPosters: async (
    opts: { flagged?: boolean; skip: number; take: number },
  ) => {
    const where = opts.flagged !== undefined ? { isFlagged: opts.flagged } : {};

    const [items, total] = await prisma.$transaction([
      prisma.poster.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: opts.skip,
        take: opts.take,
        select: {
          id: true,
          status: true,
          isFlagged: true,
          generatedImageUrl: true,
          formData: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
          template: { select: { id: true, title: true, occasionType: true } },
        },
      }),
      prisma.poster.count({ where }),
    ]);

    return { items, total };
  },

  findPosterById: (id: string) =>
    prisma.poster.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        isFlagged: true,
        generatedImageUrl: true,
        generatedImagePublicId: true,
        uploadedPhotoPublicIds: true,
      },
  }),

  setFlag: (id: string, isFlagged: boolean) =>
    prisma.poster.update({
      where: { id },
      data: { isFlagged },
    }),

  deletePosterById: (id: string) =>
    prisma.poster.delete({ where: { id } }),
};
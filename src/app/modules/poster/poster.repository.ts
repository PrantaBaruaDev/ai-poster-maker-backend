import { prisma } from "../../lib/prisma";
import type { PosterFormData } from "./poster.interface";

export const posterRepository = {
  create: (data: {
    userId: string;
    templateId: string;
    formData: PosterFormData;
    photoUrls: string[];
    photoPublicIds: string[];
  }) =>
    prisma.poster.create({
      data: {
        userId: data.userId,
        templateId: data.templateId,
        formData: data.formData as unknown as object,
        uploadedPhotoUrls: data.photoUrls,
        uploadedPhotoPublicIds: data.photoPublicIds,
        status: "GENERATING",
      },
    }),

  findByIdForUser: (id: string, userId: string) =>
    prisma.poster.findFirst({
      where: { id, userId },
      include: {
        template: {
          select: {
            id: true,
            title: true,
            occasionType: true,
            htmlTemplateKey: true,
            layoutConfig: true,
            cachedDecoration: true,
          },
        },
      },
    }),

  findById: (id: string) =>
    prisma.poster.findUnique({
      where: { id },
      include: {
        template: {
          select: {
            id: true,
            title: true,
            occasionType: true,
            htmlTemplateKey: true,
            layoutConfig: true,
            cachedDecoration: true,
          },
        },
      },
    }),

  history: async (userId: string, skip: number, take: number) => {
    const [items, total] = await prisma.$transaction([
      prisma.poster.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          status: true,
          generatedImageUrl: true,
          createdAt: true,
          formData: true,
        },
      }),
      prisma.poster.count({ where: { userId } }),
    ]);
    return { items, total };
  },

  tryStartRegenerate: (
    id: string,
    userId: string,
    maxRetries: number,
    newFormData?: Partial<PosterFormData>,
  ) =>
    prisma.poster.updateMany({
      where: {
        id,
        userId,
        status: { not: "GENERATING" },
        retryCount: { lt: maxRetries },
      },
      data: {
        status: "GENERATING",
        retryCount: { increment: 1 },
        errorMessage: null,
        ...(newFormData && {
          formData: newFormData as object,
        }),
      },
    }),

  markCompleted: (
    id: string,
    imageUrl: string,
    imagePublicId: string,
    log: {
      prompt: string | null;
      latencyMs: number | null;
      tokensUsed: number | null;
      renderMs: number;
    },
  ) =>
    prisma.$transaction([
      prisma.poster.update({
        where: { id },
        data: {
          status: "COMPLETED",
          generatedImageUrl: imageUrl,
          generatedImagePublicId: imagePublicId,
        },
      }),
      prisma.generationLog.create({
        data: {
          posterId: id,
          geminiPromptUsed: log.prompt,
          tokensUsed: log.tokensUsed,
          latencyMs: log.latencyMs,
          renderMs: log.renderMs,
          success: true,
        },
      }),
    ]),

  markFailed: (id: string, errorMessage: string) =>
    prisma.$transaction([
      prisma.poster.update({
        where: { id },
        data: { status: "FAILED", errorMessage },
      }),
      prisma.generationLog.create({
        data: {
          posterId: id,
          success: false,
          error: errorMessage,
        },
      }),
    ]),

  saveLayout: (id: string, layoutResult: object) =>
    prisma.poster.update({
      where: { id },
      data: { layoutResult },
    }),

  deleteForUser: (id: string, userId: string) =>
    prisma.poster.deleteMany({ where: { id, userId } }),

  deleteById: (id: string) =>
    prisma.poster.deleteMany({ where: { id } }),

  failStuckGenerating: (cutoff: Date) =>
    prisma.poster.updateMany({
      where: { status: "GENERATING", updatedAt: { lt: cutoff } },
      data: {
        status: "FAILED",
        errorMessage: "Generation timed out or was interrupted",
      },
    }),
};
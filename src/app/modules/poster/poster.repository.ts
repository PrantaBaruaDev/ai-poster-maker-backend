import { Prisma } from "@db/client";
import { prisma } from "../../lib/prisma";
import type { PosterFormData } from "./poster.interface";
import type { PosterStatus } from "@db/enums";

export const posterRepository = {
  create: (data: {
    userId: string;
    templateId: string;
    formData: PosterFormData;
    photoUrls: string[];
  }) =>
    prisma.poster.create({
      data: {
        userId: data.userId,
        templateId: data.templateId,
        formData: data.formData as unknown as Prisma.InputJsonValue,
        uploadedPhotoUrls: data.photoUrls,
        status: "GENERATING",
      },
    }),

  /** Owner-scoped fetch — includes template for the render step. */
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

  /** Admin-scoped fetch — no user filter. */
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

  /** Paginated history + total in one round trip. */
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

  /**
   * Atomic regenerate guard — increments retryCount + sets GENERATING
   * ONLY if the poster is in a terminal state and retries remain.
   * Returns how many rows were updated (0 = guard rejected).
   */
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
            formData: newFormData as unknown as Prisma.InputJsonValue,
        }),
      },
    }),

  /** Mark COMPLETED + write GenerationLog atomically. */
  markCompleted: (
    id: string,
    imageUrl: string,
    log: { prompt: string | null; latencyMs: number | null; tokensUsed: number | null; renderMs: number },
  ) =>
    prisma.$transaction([
      prisma.poster.update({
        where: { id },
        data: { status: "COMPLETED", generatedImageUrl: imageUrl },
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

  /** Mark FAILED + write GenerationLog atomically. */
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

  /** Save the resolved layout so history can show it. */
  saveLayout: (id: string, layoutResult: object) =>
    prisma.poster.update({
        where: { id },
        data: { layoutResult: layoutResult as unknown as Prisma.InputJsonValue },

    }),

  deleteForUser: (id: string, userId: string) =>
    prisma.poster.deleteMany({ where: { id, userId } }),

  /** Startup recovery — mark stale GENERATING as FAILED. */
  failStuckGenerating: (cutoff: Date) =>
    prisma.poster.updateMany({
      where: { status: "GENERATING", updatedAt: { lt: cutoff } },
      data: {
        status: "FAILED",
        errorMessage: "Generation timed out or was interrupted",
      },
    }),

};
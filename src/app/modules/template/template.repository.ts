import { prisma } from "../../lib/prisma";
import type { OccasionType } from "@db/enums";

export const templateRepository = {
  listActive: (occasion?: OccasionType) =>
    prisma.template.findMany({
      where: {
        isActive: true,
        ...(occasion && { occasionType: occasion }),
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        slug: true,
        title: true,
        occasionType: true,
        thumbnailUrl: true,
      },
    }),

  findActiveById: (id: string) =>
    prisma.template.findFirst({
      where: { id, isActive: true },
    }),

  findActiveBySlug: (slug: string) =>
    prisma.template.findFirst({
      where: { slug, isActive: true },
    }),
};
import type { z } from "zod";
import type {
  createTemplateSchema,
  updateTemplateSchema,
  listPostersQuerySchema,
} from "./admin.validation";

export type CreateTemplateBody = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateBody = z.infer<typeof updateTemplateSchema>;
export type ListPostersQuery = z.infer<typeof listPostersQuerySchema>;

export interface AdminTemplateListItem {
  id: string;
  slug: string;
  title: string;
  occasionType: string;
  thumbnailUrl: string;
  htmlTemplateKey: string;
  isActive: boolean;
  createdAt: Date;
  _count: { posters: number };
}
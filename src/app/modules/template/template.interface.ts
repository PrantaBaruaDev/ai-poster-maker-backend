import type { OccasionType } from "@db/enums";

export interface TemplateListItem {
  id: string;
  slug: string;
  title: string;
  occasionType: OccasionType;
  thumbnailUrl: string;
}

export interface TemplateDetail {
  id: string;
  slug: string;
  title: string;
  occasionType: OccasionType;
  thumbnailUrl: string;
  htmlTemplateKey: string;
  layoutConfig: unknown;
  isActive: boolean;
  createdAt: Date;
}

export interface ListTemplatesQuery {
  occasion?: OccasionType;
}
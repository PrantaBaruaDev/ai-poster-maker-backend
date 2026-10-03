import type { z } from "zod";
import type { createPosterSchema, regenerateSchema } from "./poster.validation";

export type CreatePosterBody = z.infer<typeof createPosterSchema>;
export type RegenerateBody = z.infer<typeof regenerateSchema>;

export interface PosterFormData {
  name: string;
  designation: string;
  party: string;
  district?: string;
  headline: string;
  subheadline?: string;
  slogan?: string;
  tribute?: string;
}

export interface PosterListItem {
  id: string;
  status: "DRAFT" | "GENERATING" | "COMPLETED" | "FAILED";
  generatedImageUrl: string | null;
  createdAt: Date;
  formData: PosterFormData;
}

export interface PosterDetail {
  id: string;
  userId: string;
  templateId: string;
  formData: PosterFormData;
  uploadedPhotoUrls: string[];
  layoutResult: unknown;
  generatedImageUrl: string | null;
  status: "DRAFT" | "GENERATING" | "COMPLETED" | "FAILED";
  retryCount: number;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  template?: {
    id: string;
    title: string;
    occasionType: string;
    htmlTemplateKey: string;
    layoutConfig: unknown;
    cachedDecoration: unknown;
  };
}
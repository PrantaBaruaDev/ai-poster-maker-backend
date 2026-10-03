import { z } from "zod";

const banglaOrLatinString = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .refine(
    (s) => s.length > 0,
    "Must contain at least one character",
  );

const formDataSchema = z.object({
  name: banglaOrLatinString.max(80),
  designation: banglaOrLatinString.max(80),
  party: banglaOrLatinString.max(120),
  district: banglaOrLatinString.max(80).optional(),
  headline: banglaOrLatinString.max(60),
  subheadline: banglaOrLatinString.max(80).optional(),
  slogan: banglaOrLatinString.max(80).optional(),
  tribute: banglaOrLatinString.max(200).optional(),
});

export const createPosterSchema = z.object({
    templateId: z.string().min(1),
    formData: formDataSchema,
    photoUrls: z
      .array(z.string().url("Each photo URL must be valid"))
      .max(3, "Maximum 3 photos allowed")
      .default([]),
});

export const regenerateSchema = z.object({
    formData: formDataSchema.partial().optional(),
});
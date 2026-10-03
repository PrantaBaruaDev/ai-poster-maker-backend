import { z } from "zod";

const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a #RRGGBB hex color");

const colorSchemeSchema = z.object({
  primary: hexColor,
  accent: hexColor,
  text: hexColor,
  background: hexColor,
});

const photoSlotSchema = z.object({
  id: z.string().min(1),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  shape: z.enum(["rect", "circle"]).optional(),
});

const layoutConfigSchema = z.object({
  canvas: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  photoSlots: z.array(photoSlotSchema).min(1).max(3),
  textSlots: z.record(z.string(), z.unknown()),
  colorScheme: colorSchemeSchema,
});

export const createTemplateSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and dashes"),
  title: z.string().trim().min(1).max(120),
  occasionType: z.enum([
    "VICTORY",
    "MOURNING",
    "CAMPAIGN",
    "GREETINGS",
    "FESTIVAL",
  ]),
  thumbnailUrl: z.string().min(1).max(500),
  htmlTemplateKey: z.string().min(1).max(64),
  layoutConfig: layoutConfigSchema,
  isActive: z.boolean().optional().default(true),
});

export const updateTemplateSchema = createTemplateSchema
  .omit({ slug: true })
  .partial();

export const listPostersQuerySchema = z.object({
  flagged: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => v === "true"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const toggleFlagSchema = z.object({
  isFlagged: z.boolean(),
  reason: z.string().max(500).optional(),
});
import { z } from "zod";

const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a #RRGGBB hex color");

export const geminiLayoutSchema = z.object({
  palette: z.object({
    primary: hexColor,
    accent: hexColor,
    text: hexColor,
    background: hexColor,
  }),

  photoCrops: z
    .array(
      z.object({
        slot: z.number().int().min(0).max(2),
        focusX: z.number().min(0).max(1),
        focusY: z.number().min(0).max(1),
        zoom: z.number().min(0.5).max(3),
      }),
    )
    .max(3)
    .default([]),

  decorations: z
    .array(z.string().max(64))
    .max(10)
    .default([]),

  headlineStyle: z.object({
    size: z.number().int().min(60).max(200),
    shadow: z.enum(["none", "soft", "heavy"]),
  }),
});

export type GeminiLayoutInput = z.input<typeof geminiLayoutSchema>;
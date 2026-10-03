import type { z } from "zod";
import type { geminiLayoutSchema } from "./generation.schema";

export type GeminiLayout = z.infer<typeof geminiLayoutSchema>;

export interface ResolvedLayout {
  palette: {
    primary: string;
    accent: string;
    text: string;
    background: string;
  };
  photoCrops: Array<{
    slot: number;
    focusX: number;
    focusY: number;
    zoom: number;
  }>;
  decorations: string[];
  headlineStyle: {
    size: number;      // px at 1200×1600
    shadow: "none" | "soft" | "heavy";
  };
  source: "gemini" | "template-default" | "template-cache";
}

export interface LayoutContext {
  occasionType: string;
  headline: string;
  templateDefaults: ResolvedLayout["palette"] & {
    photoSlots: unknown;
  };
  photoCount: number;
}
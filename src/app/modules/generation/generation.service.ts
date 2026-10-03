import config from "@/config";
import { generateJson, isGeminiConfigured } from "@/app/lib/gemini";
import { ApiError } from "@/app/errors/ApiError";
import {
  buildLayoutPrompt,
  LAYOUT_SYSTEM_PROMPT,
} from "./generation.prompt";
import { geminiLayoutSchema } from "./generation.schema";
import type {
  GeminiLayout,
  LayoutContext,
  ResolvedLayout,
} from "./generation.interface";

const fallbackLayout = (
  templateDefaults: LayoutContext["templateDefaults"],
  photoCount: number,
): ResolvedLayout => ({
  palette: {
    primary: templateDefaults.primary,
    accent: templateDefaults.accent,
    text: templateDefaults.text,
    background: templateDefaults.background,
  },
  photoCrops: Array.from({ length: photoCount }, (_, i) => ({
    slot: i,
    focusX: 0.5,
    focusY: 0.3,
    zoom: 1.0,
  })),
  decorations: [],
  headlineStyle: { size: 130, shadow: "heavy" },
  source: "template-default",
});

const tryGemini = async (
  ctx: LayoutContext,
): Promise<{ layout: GeminiLayout; latencyMs: number; tokensUsed: number | null } | null> => {
  if (!isGeminiConfigured()) {
    console.log("Gemini not configured — using template defaults");
    return null;
  }

  const userPrompt = buildLayoutPrompt(ctx);

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const { text, latencyMs, tokensUsed } = await generateJson({
        systemPrompt: LAYOUT_SYSTEM_PROMPT,
        userPrompt,
        timeoutMs: 15_000,
      });

      const cleaned = text
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/i, "")
        .trim();

      const parsed = JSON.parse(cleaned);
      const validated = geminiLayoutSchema.parse(parsed);

      return { layout: validated, latencyMs, tokensUsed };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`⚠️  Gemini attempt ${attempt} failed: ${message}`);
      if (attempt === 2) return null;
    }
  }

  return null;
};

export const generationService = {

  async resolveLayout(ctx: LayoutContext): Promise<{
    layout: ResolvedLayout;
    latencyMs: number | null;
    tokensUsed: number | null;
    promptUsed: string | null;
  }> {
    const gemini = await tryGemini(ctx);

    if (gemini) {
      const { layout } = gemini;
      return {
        layout: {
          palette: layout.palette,
          photoCrops: layout.photoCrops,
          decorations: layout.decorations,
          headlineStyle: layout.headlineStyle,
          source: "gemini",
        },
        latencyMs: gemini.latencyMs,
        tokensUsed: gemini.tokensUsed,
        promptUsed: buildLayoutPrompt(ctx),
      };
    }

    return {
      layout: fallbackLayout(ctx.templateDefaults, ctx.photoCount),
      latencyMs: null,
      tokensUsed: null,
      promptUsed: null,
    };
  },
};
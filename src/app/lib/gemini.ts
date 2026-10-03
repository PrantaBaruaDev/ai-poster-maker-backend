import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "@/config";

let client: GoogleGenerativeAI | null = null;

export const isGeminiConfigured = (): boolean =>
  config.gemini_api_key.trim().length > 0;

const getClient = (): GoogleGenerativeAI => {
  if (!client) {
    if (!isGeminiConfigured()) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    client = new GoogleGenerativeAI(config.gemini_api_key);
  }
  return client;
};

export interface GenerateJsonOptions {
  systemPrompt: string;
  userPrompt: string;
  timeoutMs?: number;
}

export async function generateJson(
  opts: GenerateJsonOptions,
): Promise<{ text: string; latencyMs: number; tokensUsed: number | null }> {
  const model = getClient().getGenerativeModel({
    model: config.gemini_model,
    systemInstruction: opts.systemPrompt,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4,
      maxOutputTokens: 4096,
      // @ts-expect-error thinkingConfig may not be typed in this SDK version
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  const start = Date.now();
  const timeoutMs = opts.timeoutMs ?? 15_000;

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Gemini timeout after ${timeoutMs}ms`)), timeoutMs),
  );

  const callPromise = model.generateContent(opts.userPrompt);
  const result = await Promise.race([callPromise, timeoutPromise]);
  const latencyMs = Date.now() - start;

  const response = result.response;
  const text = response.text();

  // 🔍 Debug log — remove after confirming it works
  console.log("🔍 Gemini raw response (first 300 chars):");
  console.log(text.slice(0, 300));
  console.log("🔍 Full length:", text.length);

  const tokensUsed = response.usageMetadata?.totalTokenCount ?? null;
  return { text, latencyMs, tokensUsed };
}
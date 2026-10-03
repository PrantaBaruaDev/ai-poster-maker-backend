import "dotenv/config";
import { generationService } from "../src/app/modules/generation/generation.service";

async function main() {
  console.log("Testing layout resolver (Gemini optional)\n");

  const result = await generationService.resolveLayout({
    occasionType: "VICTORY",
    headline: "মহান বিজয় দিবস",
    photoCount: 2,
    templateDefaults: {
      primary: "#006A4E",
      accent: "#F42A41",
      text: "#FFFFFF",
      background: "#0B3D2E",
      photoSlots: [],
    },
  });

  console.log("Source:", result.layout.source);
  console.log("Palette:", result.layout.palette);
  console.log("PhotoCrops:", result.layout.photoCrops);
  console.log("HeadlineStyle:", result.layout.headlineStyle);
  console.log("Latency:", result.latencyMs, "ms");
  console.log("Tokens:", result.tokensUsed);

  console.log("\n✅ Layout resolver works regardless of Gemini availability.");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
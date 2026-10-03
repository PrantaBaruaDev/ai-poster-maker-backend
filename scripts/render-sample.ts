import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { renderPosterToPng } from "../src/app/renderer/render.service";
import { closeBrowser } from "../src/app/lib/puppeteer";

async function main() {
  console.log("🎨 Rendering sample posters...");

  const outDir = path.join(process.cwd(), "tmp", "samples");
  await fs.mkdir(outDir, { recursive: true });

  const victoryPng = await renderPosterToPng({
    htmlTemplateKey: "victory",
    headline: "মহান বিজয় দিবস",
    subheadline: "১৬ ডিসেম্বর",
    name: "মোঃ করিম উদ্দিন",
    designation: "সাধারণ সম্পাদক",
    party: "বাংলাদেশ আওয়ামী লীগ",
    district: "ঢাকা",
    photoUrls: [
      "https://upload.wikimedia.org/wikipedia/bn/0/07/%E0%A6%95%E0%A6%B0%E0%A6%BF%E0%A6%AE_%E0%A6%89%E0%A6%A6%E0%A7%8D%E0%A6%A6%E0%A6%BF%E0%A6%A8_%E0%A6%AD%E0%A6%B0%E0%A6%B8%E0%A6%BE.jpg?utm_source=bn.wikipedia.org&utm_campaign=index&utm_content=original",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCCt7LUlF-4KdTRFTxBf2axinSvYrmGECMHiY8pccftDuQNDL6V726_hU&s=10",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCCt7LUlF-4KdTRFTxBf2axinSvYrmGECMHiY8pccftDuQNDL6V726_hU&s=10",
    ],
    palette: {
      primary: "#006A4E",
      accent: "#F42A41",
      text: "#FFFFFF",
      background: "#0B3D2E",
    },
  });
  await fs.writeFile(path.join(outDir, "victory.png"), victoryPng);
  console.log("   ✓ victory.png");

  const mourningPng = await renderPosterToPng({
    htmlTemplateKey: "mourning",
    headline: "শোক ও স্মরণ",
    name: "মরহুম আব্দুল কাদের",
    designation: "সাবেক চেয়ারম্যান",
    party: "বাংলাদেশ জাতীয়তাবাদী দল",
    district: "চট্টগ্রাম",
    photoUrls: [
      "https://thumb.wikimedia.org/wikipedia/bn/thumb/f/fa/%E0%A6%86%E0%A6%AC%E0%A7%8D%E0%A6%A6%E0%A7%81%E0%A6%B2_%E0%A6%95%E0%A6%BE%E0%A6%A6%E0%A7%87%E0%A6%B0_%28%E0%A6%85%E0%A6%AD%E0%A6%BF%E0%A6%A8%E0%A7%87%E0%A6%A4%E0%A6%BE%29.jpeg/250px-%E0%A6%86%E0%A6%AC%E0%A7%8D%E0%A6%A6%E0%A7%81%E0%A6%B2_%E0%A6%95%E0%A6%BE%E0%A6%A6%E0%A7%87%E0%A6%B0_%28%E0%A6%85%E0%A6%AD%E0%A6%BF%E0%A6%A8%E0%A7%87%E0%A6%A4%E0%A6%BE%29.jpeg?utm_source=bn.wikipedia.org&utm_campaign=parser&utm_content=thumbnail",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSbB-JKklCaFNKMGAIXF8Lgtd__5-TE3sbuVREFbmd4Ci50b5Cv7TneZ5M&s=10",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSbB-JKklCaFNKMGAIXF8Lgtd__5-TE3sbuVREFbmd4Ci50b5Cv7TneZ5M&s=10",
    ],
    tribute: "আমরা তাকে কৃতজ্ঞতার সঙ্গে স্মরণ করি।",
    palette: {
      primary: "#1A1A1A",
      accent: "#C8A951",
      text: "#FFFFFF",
      background: "#000000",
    },
  });
  await fs.writeFile(path.join(outDir, "mourning.png"), mourningPng);
  console.log("   ✓ mourning.png");

  const campaignPng = await renderPosterToPng({
    htmlTemplateKey: "campaign",
    headline: "টেক ব্যাক বাংলাদেশ",
    slogan: "নৌকায় ভোট দিন",
    name: "মোছাঃ রেহানা পারভীন",
    designation: "সংসদ সদস্য প্রার্থী",
    party: "বাংলাদেশ আওয়ামী লীগ",
    district: "সিলেট-২",
    photoUrls: [
      "https://kgck.edu.bd/wp-content/uploads/2023/12/WhatsApp-Image-2025-08-24-at-1.57.36-PM.jpeg",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8djTfIHLXKHjVMhUVmXUeQ5pahxRiSE5vR4DnNetpWY3Oejf8T6kqH74&s=10",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8djTfIHLXKHjVMhUVmXUeQ5pahxRiSE5vR4DnNetpWY3Oejf8T6kqH74&s=10",
    ],
    palette: {
      primary: "#006A4E",
      accent: "#FFD700",
      text: "#FFFFFF",
      background: "#0A2A1F",
    },
  });
  await fs.writeFile(path.join(outDir, "campaign.png"), campaignPng);
  console.log("   ✓ campaign.png");

  await closeBrowser();
  console.log(`\n✅ Done. Files in: ${outDir}`);
  console.log("   Open them in an image viewer and verify:");
  console.log("   1. Bangla conjuncts render correctly (ক্ষ, স্ত, ঞ্জ)");
  console.log("   2. Text is sharp, not pixelated");
  console.log("   3. Colors match the palette");
  console.log("   4. Images are 1200×1600");
}

main().catch((err) => {
  console.error("Render failed:", err);
  process.exit(1);
});
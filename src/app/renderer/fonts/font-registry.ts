import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function findFontsDir(): string {
  const candidates = [
    __dirname,                                                    // dev: alongside this file
    path.join(process.cwd(), "dist", "fonts"),                    // copied at build
    path.join(process.cwd(), "dist", "app", "renderer", "fonts"), // tsc preserved
    path.join(process.cwd(), "src", "app", "renderer", "fonts"),  // source shipped
  ];

  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "AnekBangla-ExtraBold.ttf"))) {
      console.log(`📁 fonts dir: ${dir}`);
      return dir;
    }
  }

  console.error("fonts dir not found. Tried:");
  for (const c of candidates) console.error("   -", c);
  return candidates[0]!;
}

export const FONTS_DIR = findFontsDir();

const fontPath = (file: string): string => path.join(FONTS_DIR, file);

export type FontRole =
  | "headline"
  | "headlineAlt"
  | "accent"
  | "name"
  | "footer"
  | "serif"
  | "fallback";

export interface FontFace {
  family: string;
  weight: number | string;
  style: "normal" | "italic";
  file: string;      // absolute path
  format: "truetype" | "opentype" | "woff" | "woff2";
}

export const FONT_REGISTRY: Record<FontRole, FontFace> = {
  headline: {
    family: "Anek Bangla",
    weight: 800,
    style: "normal",
    file: fontPath("AnekBangla-ExtraBold.ttf"),   // ← uses FONTS_DIR
    format: "truetype",
  },
  headlineAlt: {
    family: "Anek Bangla",
    weight: 800,
    style: "normal",
    file: fontPath("AnekBangla-ExtraBold.ttf"),
    format: "truetype",
  },
  accent: {
    family: "Galada",
    weight: 400,
    style: "normal",
    file: fontPath("Galada-Regular.ttf"),
    format: "truetype",
  },
  name: {
    family: "Hind Siliguri",
    weight: 600,
    style: "normal",
    file: fontPath("HindSiliguri-SemiBold.ttf"),
    format: "truetype",
  },
  footer: {
    family: "Hind Siliguri",
    weight: 500,
    style: "normal",
    file: fontPath("HindSiliguri-Medium.ttf"),
    format: "truetype",
  },
  serif: {
    family: "Noto Serif Bengali",
    weight: 400,
    style: "normal",
    file: fontPath("NotoSerifBengali-Regular.ttf"),
    format: "truetype",
  },
  fallback: {
    family: "Noto Sans Bengali",
    weight: 400,
    style: "normal",
    file: fontPath("NotoSansBengali-Regular.ttf"),
    format: "truetype",
  },
};

export const fontFamily = (role: FontRole): string => {
  const def = FONT_REGISTRY[role];
  return `'${def.family}', 'Noto Sans Bengali', sans-serif`;
};

export const fontWeight = (role: FontRole): number | string =>
  FONT_REGISTRY[role].weight;

export const buildFontsCss = (): string => {
  const seen = new Set<string>();
  const lines: string[] = [];

  for (const def of Object.values(FONT_REGISTRY)) {
    const key = `${def.family}-${def.weight}-${def.style}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const url = `file://${def.file.replace(/\\/g, "/")}`;

    lines.push(`
@font-face {
  font-family: '${def.family}';
  font-style: ${def.style};
  font-weight: ${def.weight};
  src: url('${url}') format('${def.format}');
  font-display: block;
}`);
  }

  return lines.join("\n");
};

export const fontHelpers = () => ({
  fontFamily: {
    headline: fontFamily("headline"),
    headlineAlt: fontFamily("headlineAlt"),
    accent: fontFamily("accent"),
    name: fontFamily("name"),
    footer: fontFamily("footer"),
    serif: fontFamily("serif"),
    fallback: fontFamily("fallback"),
  },
  fontWeight: {
    headline: fontWeight("headline"),
    headlineAlt: fontWeight("headlineAlt"),
    accent: fontWeight("accent"),
    name: fontWeight("name"),
    footer: fontWeight("footer"),
    serif: fontWeight("serif"),
    fallback: fontWeight("fallback"),
  },
});
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

/**
 * THE single source of truth for fonts.
 * Change a font later = edit one entry here.
 */
export const FONT_REGISTRY: Record<FontRole, FontFace> = {
  headline: {
    family: "Anek Bangla",
    weight: 800,
    style: "normal",
    file: path.join(__dirname, "AnekBangla-ExtraBold.ttf"),
    format: "truetype",
  },
  headlineAlt: {
    family: "Anek Bangla",
    weight: 800,
    style: "normal",
    file: path.join(__dirname, "AnekBangla-ExtraBold.ttf"),
    format: "truetype",
  },
  accent: {
    family: "Galada",
    weight: 400,
    style: "normal",
    file: path.join(__dirname, "Galada-Regular.ttf"),
    format: "truetype",
  },
  name: {
    family: "Hind Siliguri",
    weight: 600,
    style: "normal",
    file: path.join(__dirname, "HindSiliguri-SemiBold.ttf"),
    format: "truetype",
  },
  footer: {
    family: "Hind Siliguri",
    weight: 500,
    style: "normal",
    file: path.join(__dirname, "HindSiliguri-Medium.ttf"),
    format: "truetype",
  },
  serif: {
    family: "Noto Serif Bengali",
    weight: 400,
    style: "normal",
    file: path.join(__dirname, "NotoSerifBengali-Regular.ttf"),
    format: "truetype",
  },
  fallback: {
    family: "Noto Sans Bengali",
    weight: 400,
    style: "normal",
    file: path.join(__dirname, "NotoSansBengali-Regular.ttf"),
    format: "truetype",
  },
};

/** `font-family` CSS string for a role, with safe fallback. */
export const fontFamily = (role: FontRole): string => {
  const def = FONT_REGISTRY[role];
  return `'${def.family}', 'Noto Sans Bengali', sans-serif`;
};

/** `font-weight` for a role. */
export const fontWeight = (role: FontRole): number | string =>
  FONT_REGISTRY[role].weight;

/** Generate @font-face CSS from the registry — no hand-maintained CSS. */
export const buildFontsCss = (): string => {
  const seen = new Set<string>();
  const lines: string[] = [];

  for (const def of Object.values(FONT_REGISTRY)) {
    const key = `${def.family}-${def.weight}-${def.style}`;
    if (seen.has(key)) continue;
    seen.add(key);

    // file:// URL works in Puppeteer setContent with <base> tag
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

/** Helper values passed to Handlebars templates. */
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
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Handlebars from "handlebars";
import { getBrowser, renderSemaphore } from "../lib/puppeteer";
import { buildFontsCss, fontHelpers } from "./fonts/font-registry";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, "templates");

// Register once — Handlebars helpers are global
Handlebars.registerHelper("eq", (a: unknown, b: unknown) => a === b);
Handlebars.registerHelper("gte", (a: number, b: number) => a >= b);

export interface RenderInput {
  htmlTemplateKey: string;
  headline: string;
  subheadline?: string;
  slogan?: string;
  tribute?: string;
  name: string;
  designation: string;
  party: string;
  district?: string;
  photoUrls: string[];
  palette: {
    primary: string;
    accent: string;
    text: string;
    background: string;
  };
  headlineStyle: {
    size: number;
    shadow: "none" | "soft" | "heavy";
  };
  photoCrops: Array<{
    slot: number;
    focusX: number;
    focusY: number;
    zoom: number;
  }>;
  decorations: string[];
}

const templateCache = new Map<string, HandlebarsTemplateDelegate>();

const loadTemplate = async (key: string): Promise<HandlebarsTemplateDelegate> => {
  const cached = templateCache.get(key);
  if (cached) return cached;
  const file = path.join(TEMPLATES_DIR, `${key}.hbs`);
  const raw = await fs.readFile(file, "utf-8");
  const compiled = Handlebars.compile(raw);
  templateCache.set(key, compiled);
  return compiled;
};

/** Turn shadow enum into a CSS string. */
const buildShadowCss = (
  shadow: RenderInput["headlineStyle"]["shadow"],
  primary: string,
): string => {
  switch (shadow) {
    case "none":
      return "none";
    case "soft":
      return "2px 2px 6px rgba(0,0,0,0.5)";
    case "heavy":
    default:
      return `4px 4px 0 ${primary}, 6px 6px 20px rgba(0,0,0,0.6)`;
  }
};

/** Pre-compute per-photo CSS from Gemini's crop suggestions. */
const buildPhotoStyles = (crops: RenderInput["photoCrops"]) =>
  crops.map((crop) => ({
    objectPosition: `${Math.round(crop.focusX * 100)}% ${Math.round(crop.focusY * 100)}%`,
    transform: `scale(${crop.zoom})`,
  }));

export async function renderPosterToPng(
  input: RenderInput,
  opts: { width?: number; height?: number } = {},
): Promise<Buffer> {
  const width = opts.width ?? 1200;
  const height = opts.height ?? 1600;

  const template = await loadTemplate(input.htmlTemplateKey);
  const fontsCss = buildFontsCss();

  const templateData = {
    ...input,
    ...fontHelpers(),
    // Pre-computed CSS values — templates just interpolate
    headlineSizePx: input.headlineStyle.size,
    headlineShadowCss: buildShadowCss(input.headlineStyle.shadow, input.palette.primary),
    photoStyles: buildPhotoStyles(input.photoCrops),
    // Convenience booleans for template conditionals
    hasDecorations: input.decorations.length > 0,
    decorationList: input.decorations.join(","),
  };

  let html = template(templateData);
  html = html.replace("@font-face-css-placeholder", fontsCss);

  await renderSemaphore.acquire();
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
      await page.setViewport({ width, height, deviceScaleFactor: 1 });
      await page.setContent(html, { waitUntil: "load", timeout: 30_000 });
      await page.evaluateHandle("document.fonts.ready");

      await page.evaluate(async () => {
        const imgs = Array.from(document.images);
        await Promise.all(
          imgs.map((img) =>
            img.complete
              ? Promise.resolve()
              : new Promise<void>((resolve) => {
                  img.onload = () => resolve();
                  img.onerror = () => resolve();
                }),
          ),
        );
      });

      const png = (await page.screenshot({
        type: "png",
        omitBackground: false,
        clip: { x: 0, y: 0, width, height },
      })) as Buffer;

      return png;
    } finally {
      await page.close();
    }
  } finally {
    renderSemaphore.release();
  }
}
import fs from "node:fs/promises";
import path from "node:path";

const ASSETS: Array<{ from: string; to: string }> = [
  { from: "src/app/renderer/templates", to: "dist/templates" },
  { from: "src/app/renderer/fonts",     to: "dist/fonts" },
  { from: "src/app/renderer/assets",    to: "dist/assets" },
];

async function copyDir(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(s, d);
    } else {
      await fs.copyFile(s, d);
    }
  }
}

async function main() {
  for (const { from, to } of ASSETS) {
    try {
      await copyDir(from, to);
      const count = (await fs.readdir(to, { recursive: true })).length;
      console.log(`✅ ${from} → ${to} (${count} items)`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`⚠️  skipped ${from}: ${msg}`);
    }
  }
}

main().catch((err) => {
  console.error("❌ copy-assets failed:", err);
  process.exit(1);
});
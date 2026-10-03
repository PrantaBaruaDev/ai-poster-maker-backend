import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from '../generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const canvas = { width: 1200, height: 1600 };

const victoryLayout = {
  canvas,
  photoSlots: [
    { id: "leader1", x: 180, y: 200, w: 380, h: 480, shape: "rect" },
    { id: "leader2", x: 640, y: 200, w: 380, h: 480, shape: "rect" },
  ],
  textSlots: {
    headline:    { x: 600, y: 820,  align: "center", maxSize: 140 },
    subheadline: { x: 600, y: 960,  align: "center", maxSize: 56 },
    name:        { x: 600, y: 1300, align: "center", maxSize: 48 },
    designation: { x: 600, y: 1370, align: "center", maxSize: 36 },
    footer:      { x: 600, y: 1520, align: "center", maxSize: 28 },
  },
  colorScheme: {
    primary:    "#006A4E",
    accent:     "#F42A41",
    text:       "#FFFFFF",
    background: "#0B3D2E",
  },
};

const mourningLayout = {
  canvas,
  photoSlots: [
    { id: "portrait", x: 420, y: 180, w: 360, h: 440, shape: "circle" },
  ],
  textSlots: {
    headline:    { x: 600, y: 720,  align: "center", maxSize: 110 },
    name:        { x: 600, y: 900,  align: "center", maxSize: 52 },
    designation: { x: 600, y: 980,  align: "center", maxSize: 36 },
    tribute:     { x: 600, y: 1200, align: "center", maxSize: 44 },
    footer:      { x: 600, y: 1520, align: "center", maxSize: 28 },
  },
  colorScheme: {
    primary:    "#1A1A1A",
    accent:     "#FFFFFF",
    text:       "#FFFFFF",
    background: "#000000",
  },
};

const campaignLayout = {
  canvas,
  photoSlots: [
    { id: "leader", x: 120, y: 160, w: 500, h: 620, shape: "rect" },
    { id: "symbol", x: 720, y: 260, w: 340, h: 340, shape: "rect" },
  ],
  textSlots: {
    headline:    { x: 600, y: 900,  align: "center", maxSize: 130 },
    slogan:      { x: 600, y: 1040, align: "center", maxSize: 60 },
    name:        { x: 600, y: 1280, align: "center", maxSize: 50 },
    designation: { x: 600, y: 1350, align: "center", maxSize: 36 },
    footer:      { x: 600, y: 1520, align: "center", maxSize: 28 },
  },
  colorScheme: {
    primary:    "#006A4E",
    accent:     "#FFD700",
    text:       "#FFFFFF",
    background: "#0A2A1F",
  },
};

// ─────────────────────────────────────────────
// Seed
// ─────────────────────────────────────────────

const templates = [
  {
    slug: "victory-day",
    title: "মহান বিজয় দিবস",
    occasionType: "VICTORY" as const,
    thumbnailUrl: "/templates/victory-day.png",
    htmlTemplateKey: "victory",
    layoutConfig: victoryLayout,
  },
  {
    slug: "mourning-tribute",
    title: "শোক ও স্মরণ",
    occasionType: "MOURNING" as const,
    thumbnailUrl: "/templates/mourning-tribute.png",
    htmlTemplateKey: "mourning",
    layoutConfig: mourningLayout,
  },
  {
    slug: "campaign-poster",
    title: "নির্বাচনী প্রচার",
    occasionType: "CAMPAIGN" as const,
    thumbnailUrl: "/templates/campaign-poster.png",
    htmlTemplateKey: "campaign",
    layoutConfig: campaignLayout,
  },
];

async function main() {
  console.log("🌱 Seeding templates...");

  for (const t of templates) {
    const result = await prisma.template.upsert({
      where:  { slug: t.slug },
      update: {
        title:           t.title,
        occasionType:    t.occasionType,
        thumbnailUrl:    t.thumbnailUrl,
        htmlTemplateKey: t.htmlTemplateKey,
        layoutConfig:    t.layoutConfig,
      },
      create: {
        slug:            t.slug,
        title:           t.title,
        occasionType:    t.occasionType,
        thumbnailUrl:    t.thumbnailUrl,
        htmlTemplateKey: t.htmlTemplateKey,
        layoutConfig:    t.layoutConfig,
        isActive:        true,
      },
    });
    console.log(`   ✓ ${result.slug} (${result.id})`);
  }

  const count = await prisma.template.count();
  console.log(`✅ Seeded. Template count: ${count}`);
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
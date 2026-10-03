-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "OccasionType" AS ENUM ('VICTORY', 'MOURNING', 'CAMPAIGN', 'GREETINGS', 'FESTIVAL');

-- CreateEnum
CREATE TYPE "PosterStatus" AS ENUM ('DRAFT', 'GENERATING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "GenerationLog" (
    "id" TEXT NOT NULL,
    "posterId" TEXT NOT NULL,
    "geminiPromptUsed" TEXT,
    "tokensUsed" INTEGER,
    "latencyMs" INTEGER,
    "renderMs" INTEGER,
    "success" BOOLEAN NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GenerationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Poster" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "formData" JSONB NOT NULL,
    "uploadedPhotoUrls" TEXT[],
    "layoutResult" JSONB,
    "generatedImageUrl" TEXT,
    "status" "PosterStatus" NOT NULL DEFAULT 'DRAFT',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Poster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "occasionType" "OccasionType" NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "htmlTemplateKey" TEXT NOT NULL,
    "layoutConfig" JSONB NOT NULL,
    "cachedDecoration" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GenerationLog_posterId_idx" ON "GenerationLog"("posterId");

-- CreateIndex
CREATE INDEX "Poster_userId_createdAt_idx" ON "Poster"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Poster_status_updatedAt_idx" ON "Poster"("status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Template_slug_key" ON "Template"("slug");

-- CreateIndex
CREATE INDEX "Template_occasionType_isActive_idx" ON "Template"("occasionType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "GenerationLog" ADD CONSTRAINT "GenerationLog_posterId_fkey" FOREIGN KEY ("posterId") REFERENCES "Poster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poster" ADD CONSTRAINT "Poster_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poster" ADD CONSTRAINT "Poster_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

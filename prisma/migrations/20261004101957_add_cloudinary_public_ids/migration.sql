-- AlterTable
ALTER TABLE "Poster" ADD COLUMN     "generatedImagePublicId" TEXT,
ADD COLUMN     "uploadedPhotoPublicIds" TEXT[];

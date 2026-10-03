/**
 * clodinary temp image uploader fro
 */
// 10 minutes from current upload time (in seconds)
// const expiresAt = Math.floor(Date.now() / 1000) + 600;

// const cloudinaryResult = await cloudinary.uploader.upload(file.path, {
//   folder: "pending_avatars", // Always the exact same folder name
//   expires_at: expiresAt,      // File-level TTL managed automatically by Cloudinary
// });


import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse } from "cloudinary";
import config from "@/config";

cloudinary.config({
  cloud_name: config.cloudinary_cloud_name,
  api_key:    config.cloudinary_api_key,
  api_secret: config.cloudinary_api_secrect,
  secure:     true,
});

export interface UploadOptions {
  folder?: string;
  publicId?: string;
  transformation?: Record<string, unknown>;
}

export const uploadBuffer = (
  buffer: Buffer,
  options: UploadOptions = {},
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder ?? config.cloudinary_folder,
        resource_type: "image",
        ...(options.publicId && { public_id: options.publicId }),
        ...(options.transformation && { transformation: options.transformation }),
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve(result);
      },
    );
    stream.end(buffer);
  });
};

export const deleteAsset = async (publicId: string): Promise<string> => {
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });
  return result.result;
};

export { cloudinary };
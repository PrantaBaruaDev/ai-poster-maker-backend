import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ApiError } from "../../errors/ApiError";
import { uploadBuffer } from "@/app/lib/cloudinary";
import { validateMagicBytes } from "./upload.middleware";
import { buildPublicId } from "@/app/utils/uniqueName";

export const uploadController = {
  uploadPhoto: catchAsync(async (req: Request, res: Response) => {
    if (!req.file) throw new ApiError(400, "No file uploaded");
    if (!req.user) throw new ApiError(401, "Not authenticated");

    validateMagicBytes(req.file.buffer);

    const userId = req.user.id;
    const publicId = buildPublicId(userId, req.file.originalname);

    const result = await uploadBuffer(req.file.buffer, {
      folder: `poster-maker/uploads/${userId}`,
      publicId,
    });

    sendResponse(res, 201, {
      message: "File uploaded",
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        format: result.format,
      },
    });
  }),
};
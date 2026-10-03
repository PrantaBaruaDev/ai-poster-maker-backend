import { Router } from "express";
import { uploadController } from "./upload.controller";
import { uploadPhoto } from "./upload.middleware";
import { auth } from "@/app/middlewares/checkAuth";
import { uploadLimiter } from "@/app/middlewares/rateLimit.middleware";

const router = Router();

router.post(
  "/",
  auth(),
  uploadLimiter,
  uploadPhoto,
  uploadController.uploadPhoto,
);

export const uploadRoutes = router;
import { Router } from "express";
import { uploadController } from "./upload.controller";
import { uploadPhoto } from "./upload.middleware";
import { auth } from "@/app/middlewares/checkAuth";

const router = Router();

router.post(
  "/",
  auth(),
  uploadPhoto,
  uploadController.uploadPhoto,
);

export const uploadRoutes = router;
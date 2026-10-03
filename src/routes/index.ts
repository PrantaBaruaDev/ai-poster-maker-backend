import { Router } from "express";
import { authRoutes } from "../app/modules/auth/auth.route";
import { uploadRoutes } from "@/app/modules/upload/upload.route";
import { templateRoutes } from "@/app/modules/template/template.route";
import { posterRoutes } from "@/app/modules/poster/poster.route";

const router = Router();

router.use("/auth", authRoutes);
router.use("/upload", uploadRoutes);
router.use("/templates", templateRoutes);
router.use("/posters", posterRoutes);

export const apiRoutes = router;
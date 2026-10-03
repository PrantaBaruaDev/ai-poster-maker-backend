import { Router } from "express";
import { authRoutes } from "../app/modules/auth/auth.route";
import { uploadRoutes } from "@/app/modules/upload/upload.route";
import { templateRoutes } from "@/app/modules/template/template.route";
import { posterRoutes } from "@/app/modules/poster/poster.route";
import { authRateLimiter } from "@/app/middlewares/rateLimit.middleware";
import { adminRoutes } from "@/app/modules/admin/admin.route";

const router = Router();

router.use("/auth", authRateLimiter, authRoutes);
router.use("/upload", uploadRoutes);
router.use("/templates", templateRoutes);
router.use("/posters", posterRoutes);
router.use("/admin", adminRoutes);

export const apiRoutes = router;
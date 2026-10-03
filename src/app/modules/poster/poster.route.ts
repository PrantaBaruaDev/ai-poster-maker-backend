import { Router } from "express";
import { posterController } from "./poster.controller";
import { auth } from "@/app/middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { posterGenerationLimiter } from "../../middlewares/rateLimit.middleware";
import { createPosterSchema, regenerateSchema } from "./poster.validation";
import { Role } from "@db/enums";

const router = Router();

router.post(
  "/",
  auth(),
  posterGenerationLimiter,
  validateRequest(createPosterSchema),
  posterController.create,
);

router.get("/me", auth(), posterController.history);

router.get("/:id", auth(), posterController.getById);

router.post(
  "/:id/regenerate",
  auth(),
  posterGenerationLimiter,
  validateRequest(regenerateSchema),
  posterController.regenerate,
);

router.delete("/:id", auth(Role.ADMIN), posterController.delete);

export const posterRoutes = router;
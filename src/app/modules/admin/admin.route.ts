import { Router } from "express";
import { adminController } from "./admin.controller";
import { auth } from "@/app/middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import {
  createTemplateSchema,
  updateTemplateSchema,
} from "./admin.validation";
import { Role } from "@db/enums";

const router = Router();

router.use(auth(Role.ADMIN));

router.get("/templates", adminController.listTemplates);
router.post(
  "/templates",
  validateRequest(createTemplateSchema),
  adminController.createTemplate,
);
router.patch(
  "/templates/:id",
  validateRequest(updateTemplateSchema),
  adminController.updateTemplate,
);
router.delete("/templates/:id", adminController.deleteTemplate);

router.get("/posters", adminController.listPosters);
router.patch("/posters/:id/flag", adminController.setFlag);
router.delete("/posters/:id", adminController.deletePoster);

export const adminRoutes = router;
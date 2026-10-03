import { Router } from "express";
import { templateController } from "./template.controller";
import { auth } from "@/app/middlewares/checkAuth";

const router = Router();

router.get("/",    auth(), templateController.list);
router.get("/:id", auth(), templateController.getById);

export const templateRoutes = router;
import { Router } from "express";
import { authController } from "./auth.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { loginSchema, registerSchema } from "./auth.validation";
import { auth } from "@/app/middlewares/checkAuth";
import { Role } from "@db/enums";

const router = Router();

router.post("/register", validateRequest(registerSchema), authController.register);
router.post("/login", validateRequest(loginSchema), authController.login);
router.post("/logout", authController.logout);
router.get ("/me", auth(Role.ADMIN, Role.USER), authController.me);

export const authRoutes = router;
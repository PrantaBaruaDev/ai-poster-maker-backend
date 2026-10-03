import { Router } from "express";
import { authRoutes } from "../app/modules/auth/auth.route";

const router = Router();

router.use("/auth", authRoutes);


export const apiRoutes = router;
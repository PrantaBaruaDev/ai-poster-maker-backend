import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import httpStatus from "http-status";
import config from "@/config";
import passport from "passport";
import helmet from "helmet";
import "./app/lib/passport";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import { notFound } from "./app/middlewares/notFound";
// import { AuthRoutes } from "./app/modules/auth/auth.route";
import {
	authRateLimiter,
	globalRateLimiter,
} from "./app/middlewares/rateLimiter";
import { apiRoutes } from "./routes";

const app: Application = express();

app.use(helmet());
app.use(
	cors({
		origin: config.frontend_url,
		credentials: true,
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	}),
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.use(passport.initialize());

app.get("/", async (req: Request, res: Response) => {
	res.status(httpStatus.OK).json({
		success: true,
		message: "Welcome to AI Political Poster Maker System Backend",
	});
});

app.use("/api/v1", globalRateLimiter);
app.get("/health", (_req, res) => {
	res.json({ success: true, data: { status: "ok", ts: Date.now() } });
});

app.use("/api/v1", apiRoutes);

app.use(globalErrorHandler);
app.use(notFound);

export default app;

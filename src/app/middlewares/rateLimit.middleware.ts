import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";
import config from "@/config";

const handler =
  (message: string) =>
  (_req: Request, res: Response): void => {
    res.status(429).json({ success: false, message });
  };

const shared = {
  standardHeaders: "draft-7" as const,
  legacyHeaders: false,
  keyGenerator: (req: Request) =>
    req.user?.id ?? req.ip ?? "unknown",
};

export const posterGenerationLimiter = rateLimit({
  windowMs: config.rate_limit_window_ms || 3_600_000,
  limit: config.rate_limit_poster_max || 10,
  ...shared,
  handler: handler("Too many poster generations. Please try again later."),
});

export const uploadLimiter = rateLimit({
  windowMs: config.rate_limit_window_ms || 3_600_000,
  limit: config.rate_limit_upload_max || 30,
  ...shared,
  handler: handler("Too many uploads. Please try again later."),
});


export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    limit: 10, 
    standardHeaders: "draft-7", 
    legacyHeaders: false, 
    message: {
        success: false,
        statusCode: 429,
        message: "Too many login/auth attempts from this IP, please try again after 15 minutes.",
    },
});

export const globalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    limit: 100, 
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
        success: false,
        statusCode: 429,
        message: "Too many requests from this IP, please slow down.",
    },
});
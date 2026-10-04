import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";
import config from "@/config";

const handler =
  (message: string) =>
  (_req: Request, res: Response): void => {
    res.status(429).json({ success: false, message });
  };

const baseConfig = {
  standardHeaders: "draft-7" as const,
  legacyHeaders: false,
};

const ipKey = (req: Request) => req.ip ?? "unknown";
const userOrIpKey = (req: Request) => req.user?.id ?? req.ip ?? "unknown";

export const authRateLimiter = rateLimit({
    ...baseConfig,
    windowMs: config.auth_rate_limit_window_ms || 60_000, 
    limit: config.auth_rate_limit_max || 20, 
    keyGenerator: ipKey,
    handler: handler("Too many login attempts. Please try again in a moment."),
});

export const globalRateLimiter = rateLimit({
    ...baseConfig,
    windowMs: config.global_rate_limit_window_ms || 15 * 60 * 1000, 
    limit: config.global_rate_limit_max || 100, 
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: ipKey,
    handler: handler("Too many requests from this IP, please slow down."),
});

export const posterGenerationLimiter = rateLimit({
  ...baseConfig,
  windowMs: config.rate_limit_window_ms || 3_600_000,
  limit: config.rate_limit_poster_max || 10,
  keyGenerator: userOrIpKey,
  handler: handler("Too many poster generations. Please try again later."),
});

export const uploadLimiter = rateLimit({
  ...baseConfig,
  windowMs: config.rate_limit_window_ms || 3_600_000,
  limit: config.rate_limit_upload_max || 30,
  keyGenerator: userOrIpKey,
  handler: handler("Too many uploads. Please try again later."),
});


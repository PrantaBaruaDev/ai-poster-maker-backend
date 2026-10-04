import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";
import { Prisma } from "@db/client";
import config from "@/config";
import { ApiError } from "@/app/errors/ApiError";

export interface IErrorSource {
  path: string | number;
  message: string;
}

export const globalErrorHandler = async (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (config.node_env === "development") {
    console.error("Error from Global Error Handler:", err);
  }

  let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
  let mainMessage = "Something went wrong";
  let errorSources: IErrorSource[] = [];
  let isHandledError = false;

  const isTokenExpired =
    err instanceof jwt.TokenExpiredError ||
    (err as { name?: string })?.name === "TokenExpiredError" ||
    (err as { message?: string })?.message?.includes("jwt expired");

  const isJsonWebTokenError =
    err instanceof jwt.JsonWebTokenError ||
    (err as { name?: string })?.name === "JsonWebTokenError" ||
    (err as { message?: string })?.message?.includes("jwt malformed") ||
    (err as { message?: string })?.message?.includes("invalid token") ||
    (err as { message?: string })?.message?.includes("invalid signature");

  if (isTokenExpired) {
    statusCode = httpStatus.UNAUTHORIZED;
    mainMessage = "Unauthorized: Session expired, please log in again.";
    errorSources = [
      { path: "authorization", message: "Token has expired." },
    ];
    isHandledError = true;
  } else if (isJsonWebTokenError) {
    statusCode = httpStatus.UNAUTHORIZED;
    mainMessage = "Unauthorized: Invalid or expired session, please log in again.";
    errorSources = [
      {
        path: "authorization",
        message: "Invalid or malformed authorization token.",
      },
    ];
    isHandledError = true;
  }

  else if (err instanceof ApiError) {
    statusCode = err.statusCode;
    mainMessage = err.message;
    errorSources = [{ path: req.originalUrl, message: err.message }];
    isHandledError = true;
  }

  else if (err instanceof ZodError) {
    statusCode = httpStatus.BAD_REQUEST;
    mainMessage = "Validation error: Invalid input data provided.";
    errorSources = err.issues.map((issue) => ({
      path: issue.path.map(String).join(".") || req.originalUrl,
      message: issue.message,
    }));
    isHandledError = true;
  }

  else if (err instanceof Prisma.PrismaClientValidationError) {
    console.error("❌ Prisma validation error:", err.message);
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    mainMessage = "Internal data error. Please try again.";
    errorSources = [];
    isHandledError = true;
  }

  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const targetField = (err.meta?.target as string[] | undefined)?.join(", ");

    switch (err.code) {
      case "P2002": {
        statusCode = httpStatus.CONFLICT;
        mainMessage = targetField
          ? `Duplicate value for field: ${targetField}`
          : "A record with this value already exists.";
        errorSources = [
          { path: targetField || req.originalUrl, message: mainMessage },
        ];
        break;
      }
      case "P2025": {
        statusCode = httpStatus.NOT_FOUND;
        mainMessage = "The requested record was not found.";
        errorSources = [{ path: req.originalUrl, message: mainMessage }];
        break;
      }
      case "P2003": {
        statusCode = httpStatus.BAD_REQUEST;
        mainMessage = "Related record not found.";
        errorSources = [{ path: req.originalUrl, message: mainMessage }];
        break;
      }
      case "P2000": {
        statusCode = httpStatus.BAD_REQUEST;
        mainMessage = "One of the provided values is too long.";
        errorSources = [{ path: req.originalUrl, message: mainMessage }];
        break;
      }
      default: {
        console.error("❌ Prisma known error:", err.code, err.message);
        statusCode = httpStatus.INTERNAL_SERVER_ERROR;
        mainMessage = "Internal data error. Please try again.";
        errorSources = [];
      }
    }
    isHandledError = true;
  }

  else if (err instanceof Prisma.PrismaClientInitializationError) {
    console.error("❌ Prisma init error:", err.message);
    statusCode = httpStatus.SERVICE_UNAVAILABLE;
    mainMessage = "Database unavailable. Please try again shortly.";
    errorSources = [];
    isHandledError = true;
  }

  else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    console.error("❌ Prisma unknown error:", err.message);
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    mainMessage = "Internal data error. Please try again.";
    errorSources = [];
    isHandledError = true;
  }

  else if (err instanceof Error) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    mainMessage =
      config.node_env === "production" ? "Something went wrong" : err.message;
    errorSources = [{ path: req.originalUrl, message: mainMessage }];
    isHandledError = true;
  }

  if (config.node_env === "production" && !isHandledError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    mainMessage = "Something went wrong";
    errorSources = [];
  }

  const devDetails = config.node_env === "development"
      ? {
          rawMessage:
            err instanceof Error
              ? err.message
                  .replace(/\t/g, "    ")
                  .split(/[\r\n]+/)
                  .filter((line) => line.trim().length > 0)
              : undefined,
          rawCode: (err as { code?: string })?.code,
          details: (err as { details?: unknown })?.details || err,
          stack:
            err instanceof Error && err.stack
              ? err.stack
                  .replace(/\t/g, "    ")
                  .split("\n")
                  .map((line) => line.trim())
              : undefined,
        }
      : undefined;

  res.status(statusCode).json({
    success: false,
    message: mainMessage,
    errors: errorSources,
    ...(devDetails && { devDetails }),
  });
};
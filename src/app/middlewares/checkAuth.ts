import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { prisma } from "../lib/prisma";
import { catchAsync } from "../utils/catchAsync";
import { ApiError } from "../errors/ApiError";
import { jwtUtils } from "../utils/jwt";
import config from "@/config";
import type { Role } from "@/app/modules/auth/auth.interface";

const ACCESS_COOKIE = "accessToken";

export const auth = (...requiredRoles: Role[]) =>
  catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
    const token = req.cookies?.[ACCESS_COOKIE] as string | undefined;

    if (!token) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Not authenticated");
    }

    const verified = jwtUtils.verifyToken(token, config.jwt_access_secret);
    if (!verified.success || !verified.data) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        config.node_env === "development"
          ? verified.error ?? "Invalid token"
          : "Session expired. Please log in again.",
      );
    }

    const { id, email, name, role } = verified.data as {
      id: string;
      email: string;
      name: string;
      role: Role;
    };

    if (!id || !role) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token payload");
    }

    if (requiredRoles.length && !requiredRoles.includes(role)) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Forbidden: You do not have permission to access this resource",
      );
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "User account no longer exists",
      );
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
    };

    next();
});
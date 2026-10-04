import type { Request, Response } from "express";
import { authService } from "./auth.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ApiError } from "../../errors/ApiError";
import { jwtUtils } from "@/app/utils/jwt";
import config from "@/config";
import { accessCookieOptions, refreshCookieOptions } from "./auth.utils";

const ACCESS_COOKIE = "accessToken";
const REFRESH_COOKIE = "refreshToken";

const setAuthCookies = (res: Response, access: string, refresh: string) => {
  res.cookie(ACCESS_COOKIE, access, accessCookieOptions);
  res.cookie(REFRESH_COOKIE, refresh, refreshCookieOptions);
};

const clearAuthCookies = (res: Response) => {
  res.clearCookie(ACCESS_COOKIE, { ...accessCookieOptions, maxAge: 0 });
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions, maxAge: 0 });
};

export const authController = {
  register: catchAsync(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    sendResponse(res, 201, {
      message: "Registered successfully",
      data: { user: result.user },
    });
  }),

  login: catchAsync(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    sendResponse(res, 200, {
      message: "Logged in successfully",
      data: { user: result.user },
    });
  }),

  refresh: catchAsync(async (req: Request, res: Response) => {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!token) throw new ApiError(401, "No refresh token");

    const verified = jwtUtils.verifyToken(token, config.jwt_refresh_secret);
    if (!verified.success || !verified.data) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const { id } = verified.data as { id: string };
    const user = await authService.me(id); // reuse; will throw if missing

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const newAccess = jwtUtils.createToken(
      payload,
      config.jwt_access_secret,
      config.jwt_access_expires_in,
    );
    const newRefresh = jwtUtils.createToken(
      { id: user.id },
      config.jwt_refresh_secret,
      config.jwt_refresh_expires_in,
    );

    setAuthCookies(res, newAccess, newRefresh);
    sendResponse(res, 200, { message: "Token refreshed", data: { user } });
  }),

  me: catchAsync(async (req: Request, res: Response) => {
    if (!req.user) throw new ApiError(401, "Not authenticated");
    const user = await authService.me(req.user.id);
    sendResponse(res, 200, { data: { user } });
  }),

  logout: catchAsync(async (_req: Request, res: Response) => {
    clearAuthCookies(res);
    sendResponse(res, 200, { message: "Logged out" });
  }),
};
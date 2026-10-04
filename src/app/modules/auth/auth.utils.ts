import bcrypt from "bcryptjs";
import { jwtUtils } from "@/app/utils/jwt";
import config  from "@/config";
import type { JwtPayload } from "./auth.interface";
import { CookieOptions } from "express";

const SALT_ROUNDS = config.bcrypt_salt_rounds;

export const hashPassword = (plain: string): Promise<string> =>
  bcrypt.hash(plain, SALT_ROUNDS);

export const comparePassword = (
  plain: string,
  hash: string,
): Promise<boolean> => bcrypt.compare(plain, hash);

export const signToken = (payload: JwtPayload): string =>
  jwtUtils.createToken(payload, config.jwt_access_secret, config.jwt_access_expires_in);

export const verifyAuthToken = (token: string) =>
  jwtUtils.verifyToken(token, config.jwt_access_secret);

// const isProd = config.node_env === "production";
// export const cookieOptions = {
//   httpOnly: true,
//   secure: isProd,
//   sameSite: isProd ? "none" : "lax",
//   maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days,
//   path: "/",
// };

const isProd = config.node_env === "production";

const baseCookie: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax", 
};

export const accessCookieOptions: CookieOptions = {
  ...baseCookie,
  maxAge: 15 * 60 * 1000,
  path: "/",
};

export const refreshCookieOptions: CookieOptions = {
  ...baseCookie,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/api/v1/auth",
};

import bcrypt from "bcryptjs";
import { jwtUtils } from "@/app/utils/jwt";
import config  from "@/config";
import type { JwtPayload } from "./auth.interface";

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

export const cookieOptions = {
  httpOnly: true,
  secure: config.node_env === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days,
  path: "/",
};
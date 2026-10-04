import { ApiError } from "@/app/errors/ApiError";
import { authRepository } from "./auth.repository";
import {
  comparePassword,
  hashPassword,
  signToken,
} from "./auth.utils";
import type {
  LoginInput,
  RegisterInput,
  SanitizedUser,
} from "./auth.interface";
import { jwtUtils } from "@/app/utils/jwt";
import config from '@/config';
import { Role } from "@db/enums";

const sanitize = (user: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  createdAt: Date;
}): SanitizedUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  createdAt: user.createdAt,
});

export const authService = {
  async register(input: RegisterInput) {
    const existing = await authRepository.findByEmail(input.email);
    if (existing) throw new ApiError(409, "Email already registered");

    const passwordHash = await hashPassword(input.password);
    const user = await authRepository.create({ ...input, passwordHash });

    const jwtPayload = {
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
		};

    const accessToken = jwtUtils.createToken(
      jwtPayload,
			config.jwt_access_secret,
			config.jwt_access_expires_in,
    );

    const refreshToken = jwtUtils.createToken(
			jwtPayload,
			config.jwt_refresh_secret,
			config.jwt_refresh_expires_in,
		);

    return { 
      accessToken,
      refreshToken, 
      user: sanitize(user) 
    };
  },

  async login(input: LoginInput) {
    const user = await authRepository.findByEmail(input.email);
    if (!user) throw new ApiError(401, "Invalid email or password");

    const ok = await comparePassword(input.password, user.passwordHash);
    if (!ok) throw new ApiError(401, "Invalid email or password");

    const jwtPayload = {
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
		};

    const accessToken = jwtUtils.createToken(
      jwtPayload,
			config.jwt_access_secret,
			config.jwt_access_expires_in,
    );

    const refreshToken = jwtUtils.createToken(
			jwtPayload,
			config.jwt_refresh_secret,
			config.jwt_refresh_expires_in,
		);

    return { 
      accessToken,
      refreshToken, 
      user: sanitize(user) 
    };
  },

  async me(userId: string) {
    const user = await authRepository.findById(userId);
    if (!user) throw new ApiError(404, "User not found");
    return sanitize(user);
  },
};
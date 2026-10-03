import type { z } from "zod";
import type { loginSchema, registerSchema } from "./auth.validation";

export type Role = "USER" | "ADMIN";

export interface JwtPayload {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SanitizedUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  createdAt: Date;
}

export type RegisterBody = z.infer<typeof registerSchema>[];
export type LoginBody = z.infer<typeof loginSchema>[];
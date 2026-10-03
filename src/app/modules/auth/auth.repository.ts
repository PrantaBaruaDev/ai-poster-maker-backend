import { prisma } from "@/app/lib/prisma";
import type { RegisterInput } from "./auth.interface";

export const authRepository = {
  findByEmail: (email: string) =>
    prisma.user.findUnique({ where: { email } }),

  findById: (id: string) =>
    prisma.user.findUnique({ where: { id } }),

  create: (data: RegisterInput & { passwordHash: string }) =>
    prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        phone: data.phone ?? null,
      },
    }),
};
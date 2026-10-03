import type { JwtPayload } from "@/app/modules/auth/auth.interface";

declare global {
  namespace Express {
    interface User extends JwtPayload {}
  }
}

export {};
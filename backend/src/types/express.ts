import type { RoleName } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: RoleName;
        email: string;
      };
    }
  }
}

export {};

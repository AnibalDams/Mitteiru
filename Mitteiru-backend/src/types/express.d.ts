import type { AuthUser } from "../libs/auth";

declare global {
  namespace Express {
    interface Locals {
      requestId?: string;
      user?: AuthUser;
      admin?: { sub: string; email?: string };
    }
  }
}

export {};

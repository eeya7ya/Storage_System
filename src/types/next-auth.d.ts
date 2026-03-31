import type { DefaultSession, DefaultJWT } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      userId: string;
      role: "admin" | "supervisor" | "cashier";
      branch: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    userId?: string;
    role?: "admin" | "supervisor" | "cashier";
    branch?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    userId?: string;
    role?: "admin" | "supervisor" | "cashier";
    branch?: string | null;
  }
}

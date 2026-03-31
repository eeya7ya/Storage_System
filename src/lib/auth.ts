import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { loginSchema } from "@/lib/validators";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "اسم المستخدم", type: "text" },
        password: { label: "كلمة المرور", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const result = await db
          .select()
          .from(users)
          .where(
            and(
              eq(users.username, parsed.data.username),
              eq(users.isActive, true)
            )
          )
          .limit(1);

        const user = result[0];
        if (!user) return null;

        const valid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );
        if (!valid) return null;

        return {
          id: String(user.id),
          name: user.fullName,
          email: user.username,
          role: user.role,
          branch: user.branch,
          userId: String(user.id),
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = (user as { role?: string }).role as "admin" | "supervisor" | "cashier";
        token.branch = (user as { branch?: string | null }).branch ?? null;
      }
      return token;
    },
    session({ session, token }) {
      session.user.userId = token.userId as string;
      session.user.role = token.role as "admin" | "supervisor" | "cashier";
      session.user.branch = token.branch as string | null;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
});

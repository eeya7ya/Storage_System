import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Redirect unauthenticated users trying to access dashboard
  if (!session && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Redirect authenticated users away from login
  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Admin-only: user management
  if (
    pathname.startsWith("/dashboard/users") &&
    session?.user.role !== "admin"
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Admin-only: audit log
  if (
    pathname.startsWith("/dashboard/audit-log") &&
    session?.user.role !== "admin"
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Admin + Supervisor: recycle bin
  if (
    pathname.startsWith("/dashboard/recycle-bin") &&
    !["admin", "supervisor"].includes(session?.user.role ?? "")
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};

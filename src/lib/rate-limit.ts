import { db } from "@/lib/db";
import { loginAttempts, auditLog } from "@/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

/** Check if an IP is rate-limited. Returns { blocked, remaining } */
export async function checkRateLimit(
  ip: string
): Promise<{ blocked: boolean; remaining: number }> {
  const cutoff = new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000);

  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.ipAddress, ip),
        gte(loginAttempts.attemptedAt, cutoff)
      )
    );

  const count = result[0]?.count ?? 0;
  const blocked = count >= MAX_ATTEMPTS;
  const remaining = Math.max(0, MAX_ATTEMPTS - count);

  return { blocked, remaining };
}

/** Record a failed login attempt */
export async function recordFailedAttempt(
  ip: string,
  username: string
): Promise<void> {
  await db.insert(loginAttempts).values({
    ipAddress: ip,
    username,
  });
}

/** Clear login attempts for an IP (called on successful login) */
export async function clearAttempts(ip: string): Promise<void> {
  // We don't delete — just let them expire naturally
  // But we can also just insert a "success" marker by doing nothing
}

/** Cleanup old attempts (call from a scheduled job or seed) */
export async function cleanupOldAttempts(): Promise<void> {
  const cutoff = new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000);
  // No delete in Drizzle without condition — use raw sql
  await db
    .delete(loginAttempts)
    .where(
      sql`${loginAttempts.attemptedAt} < ${cutoff.toISOString()}`
    );
}

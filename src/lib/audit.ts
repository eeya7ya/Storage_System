import { auditLog } from "@/db/schema";

interface AuditEntry {
  userId?: number | null;
  action: string;
  tableName?: string;
  recordId?: number;
  oldData?: unknown;
  newData?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Write an audit log entry inside an existing transaction.
 * Always call this inside db.transaction() to ensure atomicity.
 */
export async function writeAuditLog(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any,
  entry: AuditEntry
): Promise<void> {
  await tx.insert(auditLog).values({
    userId: entry.userId ?? null,
    action: entry.action,
    tableName: entry.tableName ?? null,
    recordId: entry.recordId ?? null,
    oldData: entry.oldData ?? null,
    newData: entry.newData ?? null,
    ipAddress: entry.ipAddress ?? null,
    userAgent: entry.userAgent ?? null,
  });
}

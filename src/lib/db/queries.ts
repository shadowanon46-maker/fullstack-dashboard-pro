import { db } from "./index";
import { users, auditLogs } from "./schema";

export async function getUsers() {
  return await db.select().from(users).orderBy(users.id);
}

// Log user activity for audit purposes
export async function logActivity(
  userId: number,
  action: string,
  entityId?: number,
  metadata?: Record<string, unknown>
) {
  await db.insert(auditLogs).values({
    userId,
    action,
    entityId: entityId ?? null,
    metadata: metadata ?? null,
  });
}

// Get recent audit logs
export async function getAuditLogs(limit = 50) {
  return await db.select().from(auditLogs).orderBy(auditLogs.id).limit(limit);
}

import { db } from '../config/db';
import { auditLogs } from '../../../db/schema';

export interface CreateAuditLogPayload {
  userId?: string | null;
  actorType?: 'user' | 'system' | 'admin' | 'worker';
  action: string;
  entityType?: string;
  entityId?: string;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  requestId?: string;
}

export class AuditService {
  static async createAuditLog(data: CreateAuditLogPayload) {
    try {
      const [inserted] = await db.insert(auditLogs).values({
        userId: data.userId || null,
        actorType: data.actorType || 'user',
        action: data.action,
        entityType: data.entityType || null,
        entityId: data.entityId || null,
        oldData: data.oldData || null,
        newData: data.newData || null,
        ipAddress: data.ipAddress || null,
        requestId: data.requestId || null,
      }).returning();
      console.log(`📝 [AuditService] Logged action "${data.action}" by actor: ${data.actorType}`);
      return inserted;
    } catch (error) {
      console.error(`❌ [AuditService] Failed to record audit log for "${data.action}":`, error);
    }
  }
}

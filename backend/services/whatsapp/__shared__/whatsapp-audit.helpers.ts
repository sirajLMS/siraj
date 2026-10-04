import { logger } from "@/backend/lib/logger";
import { AuditService } from "@/backend/services/system/audit.service";
import type { AuditAction, CreateAuditLogInput, DBTransaction } from "@/backend/types";

export interface WhatsappAuditChangeOptions {
  description?: string;
  previousState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Audit helper shared by the WhatsApp account and conversations services:
 * recipient registry rows are scoped to their account, so both services audit
 * under the `WHATSAPP_ACCOUNT` entity, with the emitting service name
 * prefixed on the failure log. Audit write failures never throw — they are
 * logged and swallowed so an audit row can never fail the business action.
 */
export async function auditWhatsappChange(
  serviceName: string,
  actorUserId: string,
  action: AuditAction,
  entityId: string,
  options: WhatsappAuditChangeOptions,
  tx?: DBTransaction
): Promise<void> {
  const input: CreateAuditLogInput = {
    actorUserId,
    actorType: "USER",
    entityType: "WHATSAPP_ACCOUNT",
    entityId,
    action,
    description: options.description ?? null,
    previousState: options.previousState ?? null,
    newState: options.newState ?? null,
    metadata: options.metadata ?? null,
  };
  try {
    await AuditService.createManyAuditLogs([input], tx);
  } catch (error) {
    logger.error(
      `${serviceName}: audit write failed for action=${action} entityId=${entityId} actorUserId=${actorUserId}: ${error instanceof Error ? error.message : String(error)}`,
      { action, entityId, actorUserId, error }
    );
  }
}

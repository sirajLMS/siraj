import { createHash } from "node:crypto";
import { AuditRepository } from "@/backend/db/repo/audit";
import { logger } from "@/backend/lib/logger";
import type { CreateAuditLogInput } from "@/backend/types";

/**
 * Login attempt auditing (success + failure) for the generic `audit_logs`
 * table, going through the canonical `AuditRepository.createAuditLog` so the
 * row passes the shared insert masking/sanitization pipeline.
 *
 * Unknown-email failures never persist the raw email: the entity id is the
 * FULL SHA-256 of the address (emails are low-entropy, so a truncated hash is
 * dictionary-recoverable offline by anyone with audit access). All writes are
 * best-effort — an audit failure must never break the login flow.
 */
function hashUnknownEmail(email: string): string {
  return createHash("sha256").update(email).digest("hex");
}

async function writeLoginAuditRow(input: {
  actorUserId: string | null;
  entityId: string;
  action: CreateAuditLogInput["action"];
  description: string;
  ipAddress?: string | null;
  metadata: Record<string, unknown>;
}): Promise<void> {
  try {
    await AuditRepository.createAuditLog({
      actorUserId: input.actorUserId,
      actorType: "USER",
      entityType: "USER",
      entityId: input.entityId,
      action: input.action,
      description: input.description,
      ipAddress: input.ipAddress,
      metadata: input.metadata,
    });
  } catch (error) {
    logger.logDomainError("Failed to persist login audit log", {
      action: input.action,
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export namespace LoginAuditService {
  export async function recordLoginSuccess(userId: string, ipAddress?: string | null): Promise<void> {
    await writeLoginAuditRow({
      actorUserId: userId,
      entityId: userId,
      action: "LOGIN_SUCCESS",
      description: "Successful login",
      ipAddress,
      metadata: { reason: "SUCCESS" },
    });
  }

  export async function recordWrongPasswordLoginFailure(userId: string, ipAddress?: string | null): Promise<void> {
    await writeLoginAuditRow({
      actorUserId: userId,
      entityId: userId,
      action: "LOGIN_FAILED",
      description: "Failed login: wrong password",
      ipAddress,
      metadata: { reason: "WRONG_PASSWORD" },
    });
  }

  export async function recordUnknownEmailLoginFailure(email: string, ipAddress?: string | null): Promise<void> {
    // Never persist the raw email for unknown accounts — only a truncated
    // SHA-256, so the attempt is correlatable without leaking PII of
    // possibly-nonexistent users.
    await writeLoginAuditRow({
      actorUserId: null,
      entityId: hashUnknownEmail(email),
      action: "LOGIN_FAILED",
      description: "Failed login: unknown email",
      ipAddress,
      metadata: { reason: "UNKNOWN_EMAIL", emailHash: hashUnknownEmail(email) },
    });
  }
}

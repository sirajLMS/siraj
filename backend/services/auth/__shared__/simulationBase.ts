import { db } from "@/backend/db/drizzleDb";
import { SessionRepository } from "@/backend/db/repo/shared";
import { adminAuditLogs } from "@/backend/db/schema";
import type { SimulationAuditLogParams } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

const IPV4_REGEX = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

export function sanitizeIpAddress(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const parts = ip.split(":");
  const cleanIp = parts.length === 2 ? parts[0] : ip;
  return IPV4_REGEX.test(cleanIp) ? cleanIp : "127.0.0.1";
}

export function getSimulationExpiresAt(startedAt: Date, ttlMs: number): Date {
  return new Date(startedAt.getTime() + ttlMs);
}

export async function writeSimulationAuditLog(params: SimulationAuditLogParams): Promise<void> {
  await db.insert(adminAuditLogs).values({
    actorUserId: params.actorUserId,
    targetUserId: params.targetUserId,
    action: params.action,
    description: params.description,
    newState: params.metadata,
    ipAddress: sanitizeIpAddress(params.ipAddress),
    createdAt: new Date(),
  });
}

type StringErrorKeys<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
}[keyof T];

export async function assertSessionOwnership(
  rawSessionId: string,
  actorUserId: string,
  errorKey: StringErrorKeys<ErrorsLabels["auth"]>,
  tErrors: ErrorsLabels
): Promise<void> {
  const session = await SessionRepository.findSessionById(rawSessionId);
  if (session?.userId !== actorUserId) {
    throw new Error(tErrors.auth[errorKey]);
  }
}

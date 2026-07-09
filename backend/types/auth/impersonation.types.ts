import type { impersonationSessions } from "@/backend/db/schema/impersonation";

export type ImpersonationSessionSelectType = typeof impersonationSessions.$inferSelect;
export type ImpersonationSessionInsertType = typeof impersonationSessions.$inferInsert;

export type ImpersonationSessionReturnType = Omit<ImpersonationSessionSelectType, never> & {
  actorUser?: { id: string };
  targetUser?: { id: string };
};

export type ImpersonationSessionSubmitInput = Omit<ImpersonationSessionInsertType, "id" | "startedAt" | "isActive">;

export type RedisImpersonationData = {
  targetUserId: string;
  startedAt: string;
  expiresAt: string;
  reason?: string;
  impersonationSessionId: string;
};

export type StartImpersonationInput = {
  actorUserId: string;
  targetUserId: string;
  sessionId: string;
  reason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type ImpersonationStatusReturnType = {
  isActive: boolean;
  targetUserId?: string;
  actorUserId?: string;
  startedAt?: Date;
  expiresAt?: Date;
  reason?: string | null;
};

export type StartImpersonationReturnType = {
  token: string;
  expiresAt: Date;
  impersonationSessionId: string;
};

export type EndImpersonationReturnType = {
  token: string;
};

export type ImpersonationAuditAction = "IMPERSONATION_START" | "IMPERSONATION_END";

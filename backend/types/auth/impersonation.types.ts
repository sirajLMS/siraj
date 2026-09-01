import type { impersonationSessions } from "@/backend/db/schema/auth/impersonation";

type ImpersonationSessionSelectType = typeof impersonationSessions.$inferSelect;

export type ImpersonationSessionReturnType = Omit<ImpersonationSessionSelectType, never> & {
  actorUser?: { id: string };
  targetUser?: { id: string };
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

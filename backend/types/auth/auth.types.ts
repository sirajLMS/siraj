import type {
  adminAuditLogs,
  authRateLimits,
  passwordResetTokens,
  sessionConfig,
  sessionMetadata,
  sessions,
} from "@/backend/db/schema";
import type { AppPermission, UserRole } from "@/backend/enum";
import type { Email } from "@/backend/lib/email";
import type { UserReturnType } from "@/backend/types";

export type CurrentUserProfile = UserReturnType & {
  permissions: AppPermission[];
  notificationCount: number;
  role: UserRole;
  teacherId: string | null;
  parentId: string | null;
  /**
   * Whether the current teacher has completed the profile fields required to
   * operate on the system. Today this is driven by `nationalId` being set.
   * Always `true` for non-teacher users (the gate only applies to teachers).
   * Consumed by the dashboard layout guard to force first-login completion.
   */
  nationalIdComplete: boolean;
};

export type SessionSelectType = typeof sessions.$inferSelect;
export type SessionInsertType = typeof sessions.$inferInsert;

export type SessionMetadataSelectType = typeof sessionMetadata.$inferSelect;

export type SessionConfigSelectType = typeof sessionConfig.$inferSelect;

// Redis session data structure
export type RedisImpersonationSessionData = {
  targetUserId: string;
  startedAt: string;
  expiresAt: string;
  reason?: string;
  impersonationSessionId: string;
};

export type RedisGroupSimulationSessionData = {
  groupSlug: string;
  startedAt: string;
  expiresAt: string;
};

export type RedisSessionData = {
  userId: string;
  hashedId: string;
  payload: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  deviceName?: string;
  createdAt: string; // ISO string
  lastActivityAt: string; // ISO string
  impersonation?: RedisImpersonationSessionData;
  groupSimulation?: RedisGroupSimulationSessionData;
};

export type PasswordResetTokenInsertType = typeof passwordResetTokens.$inferInsert;

export type LoginInput = {
  email: Email;
  password: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type DemoLoginInput = {
  groupSlug: string;
};

export type LogoutUserInput = {
  readonly sessionId?: string | null;
  readonly accessToken?: string | null;
  readonly ipAddress?: string | null;
  readonly locale?: string;
};

export type AdminResetPasswordInput = {
  readonly userId: string;
  readonly newPassword: string;
  readonly sendNotificationEmail?: boolean;
};

export type AdminResetPasswordResult = {
  readonly success: boolean;
  readonly emailSent: boolean;
  readonly userId: string;
  readonly message: string;
};

export type LoginResponse = {
  user: UserReturnType;
  token: string;
};

export type RefreshTokenResponse = {
  token: string;
  user: UserReturnType;
};

export type AuthRateLimitInsertType = typeof authRateLimits.$inferInsert;

export type AdminAuditLogSelectType = typeof adminAuditLogs.$inferSelect;
export type AdminAuditLogInsertType = typeof adminAuditLogs.$inferInsert;

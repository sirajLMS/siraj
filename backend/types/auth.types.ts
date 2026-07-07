import type {
  adminAuditLogs,
  authRateLimits,
  groupPermissions,
  passwordResetTokens,
  permissionGroups,
  permissions,
  sessionConfig,
  sessionMetadata,
  sessions,
  userPermissionGroups,
  users,
} from "@/backend/db/schema";
import type { Email } from "@/backend/lib/email";
import type { AppPermission, UserRole } from "@/shared/lib/enum";
import type { PageInfo } from "./pagination.types";

export type UserSelectType = typeof users.$inferSelect;
export type UserInsertType = typeof users.$inferInsert;

export type UserReturnType = Omit<UserSelectType,
  "password" | "rememberTokenHash" | "deletedAt"
>;

export type UserSubmitInput = Omit<UserInsertType,
  "id" | "createdAt" | "updatedAt" | "password" | "rememberTokenHash" | "deletedAt"
>;

/** @remarks isSuperAdmin should only be used for UI rendering decisions — ALL auth checks must use server-side session/permissions */
export type SafeUser = UserReturnType;

// Note: role field exists on PermissionsService.getUserContext() and DashboardLayout — needs cleanup (see .ai/task-files/fix-user-role.md)
export type CurrentUserProfile = SafeUser & {
  permissions: AppPermission[];
  notificationCount: number;
  role: UserRole;
  teacherId: string | null;
  parentId: string | null;
};

export type UserCreateInput = {
  name: string;
  email: Email;
  password: string;
};

export type UserUpdateInput = {
  name: string;
  email: Email;
  password: string;
};

export type PaginatedUsersResponseSelectType = {
  data: SafeUser[];
  pageInfo: PageInfo;
};

export type PaginatedUsersResponse = {
  data: SafeUser[];
  pageInfo: PageInfo;
};

export type PermissionSelectType = typeof permissions.$inferSelect;
export type PermissionInsertType = typeof permissions.$inferInsert;

export type PermissionReturnType = PermissionSelectType;

export type PermissionSubmitInput = Omit<PermissionInsertType, "id" | "createdAt" | "updatedAt">;

export type PermissionGroupSelectType = typeof permissionGroups.$inferSelect;
export type PermissionGroupInsertType = typeof permissionGroups.$inferInsert;

export type PermissionGroupReturnType = PermissionGroupSelectType;

export type PermissionGroupSubmitInput = Omit<PermissionGroupInsertType, "id" | "createdAt" | "updatedAt">;

export type GroupPermissionSelectType = typeof groupPermissions.$inferSelect;
export type GroupPermissionInsertType = typeof groupPermissions.$inferInsert;

export type GroupPermissionReturnType = GroupPermissionSelectType;

export type GroupPermissionSubmitInput = Omit<GroupPermissionInsertType, "id" | "createdAt" | "updatedAt">;

export type UserPermissionGroupSelectType = typeof userPermissionGroups.$inferSelect;
export type UserPermissionGroupInsertType = typeof userPermissionGroups.$inferInsert;

export type UserPermissionGroupReturnType = UserPermissionGroupSelectType;

export type UserPermissionGroupSubmitInput = Omit<UserPermissionGroupInsertType, "id" | "createdAt" | "updatedAt">;

export type SessionSelectType = typeof sessions.$inferSelect;
export type SessionInsertType = typeof sessions.$inferInsert;

export type SessionReturnType = SessionSelectType;

export type SessionSubmitInput = Omit<SessionInsertType, "id" | "createdAt" | "updatedAt">;

export type SessionMetadataSelectType = typeof sessionMetadata.$inferSelect;
export type SessionMetadataInsertType = typeof sessionMetadata.$inferInsert;

export type SessionConfigSelectType = typeof sessionConfig.$inferSelect;
export type SessionConfigInsertType = typeof sessionConfig.$inferInsert;

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

export type PasswordResetTokenSelectType = typeof passwordResetTokens.$inferSelect;
export type PasswordResetTokenInsertType = typeof passwordResetTokens.$inferInsert;

export type PasswordResetTokenReturnType = Omit<PasswordResetTokenSelectType, "deletedAt">;

export type PasswordResetTokenSubmitInput = Omit<PasswordResetTokenInsertType, "id" | "createdAt" | "updatedAt" | "deletedAt">;

export type LoginInput = {
  email: Email;
  password: string;
};

export type DemoLoginInput = {
  groupSlug: string;
};

export type LoginResponse = {
  user: SafeUser;
  token: string;
};

export type RefreshTokenResponse = {
  token: string;
  user: SafeUser;
};

export type AuthRateLimitSelectType = typeof authRateLimits.$inferSelect;
export type AuthRateLimitInsertType = typeof authRateLimits.$inferInsert;

export type AdminAuditLogSelectType = typeof adminAuditLogs.$inferSelect;
export type AdminAuditLogInsertType = typeof adminAuditLogs.$inferInsert;

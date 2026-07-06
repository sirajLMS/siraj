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

export type UserEntity = typeof users.$inferSelect;
export type UserEntityInput = typeof users.$inferInsert;

/** @remarks isSuperAdmin should only be used for UI rendering decisions — ALL auth checks must use server-side session/permissions */
export type SafeUser = Omit<UserEntity, "password" | "rememberTokenHash" | "deletedAt">;

// Note: role field exists on PermissionsService.getUserContext() and DashboardLayout — needs cleanup (see .ai/task-files/fix-user-role.md)
export type CurrentUserProfile = SafeUser & {
  permissions: AppPermission[];
  notificationCount: number;
  role: UserRole;
};

export type UserPothosDefinition = SafeUser & {
  permissionGroups?: PermissionGroupPothosDefinition[];
  userPermissionGroups?: UserPermissionGroupPothosDefinition[];
  sessions?: SessionPothosDefinition[];
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
  data: UserPothosDefinition[];
  pageInfo: PageInfo;
};

export type PermissionEntity = typeof permissions.$inferSelect;
export type PermissionEntityInput = typeof permissions.$inferInsert;

export type PermissionGroupEntity = typeof permissionGroups.$inferSelect;
export type PermissionGroupEntityInput = typeof permissionGroups.$inferInsert;

export type PermissionGroupPothosDefinition = PermissionGroupEntity & {
  permissions?: PermissionPothosDefinition[];
  groupPermissions?: GroupPermissionPothosDefinition[];
};

export type PermissionPothosDefinition = PermissionEntity & {
  permissionGroups?: PermissionGroupPothosDefinition[];
};

export type GroupPermissionEntity = typeof groupPermissions.$inferSelect;
export type GroupPermissionEntityInput = typeof groupPermissions.$inferInsert;

export type GroupPermissionPothosDefinition = GroupPermissionEntity & {
  permissionGroup?: PermissionGroupPothosDefinition;
  permission?: PermissionPothosDefinition;
};

export type UserPermissionGroupEntity = typeof userPermissionGroups.$inferSelect;
export type UserPermissionGroupEntityInput = typeof userPermissionGroups.$inferInsert;

export type UserPermissionGroupPothosDefinition = UserPermissionGroupEntity & {
  user?: UserPothosDefinition;
  permissionGroup?: PermissionGroupPothosDefinition;
};

export type SessionEntity = typeof sessions.$inferSelect;
export type SessionEntityInput = typeof sessions.$inferInsert;

export type SessionPothosDefinition = SessionEntity & {
  user?: UserPothosDefinition;
};

export type SessionMetadataEntity = typeof sessionMetadata.$inferSelect;
export type SessionMetadataEntityInput = typeof sessionMetadata.$inferInsert;

export type SessionConfigEntity = typeof sessionConfig.$inferSelect;
export type SessionConfigEntityInput = typeof sessionConfig.$inferInsert;

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
export type PasswordResetTokenInsertInput = typeof passwordResetTokens.$inferInsert;

// PasswordResetTokenReturnType removed — was unused. Re-create from PasswordResetTokenSelectType if needed.

export type LoginInput = {
  email: Email;
  password: string;
};

export type DemoLoginInput = {
  groupSlug: string;
};

export type LoginResponse = {
  user: UserPothosDefinition;
  token: string;
};

export type RefreshTokenResponse = {
  token: string;
  user: UserPothosDefinition;
};

export type AuthRateLimitEntity = typeof authRateLimits.$inferSelect;
export type AuthRateLimitEntityInput = typeof authRateLimits.$inferInsert;

export type AdminAuditLogSelectType = typeof adminAuditLogs.$inferSelect;
export type AdminAuditLogInsertInput = typeof adminAuditLogs.$inferInsert;

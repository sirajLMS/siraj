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
} from "@/backend/db/schema";
import type { AccountStatus, AppPermission, UserRole } from "@/backend/enum";
import type { Email } from "@/backend/lib/email";
import type { PageInfo } from "@/backend/types/shared/pagination.types";
import type { SafeUser, UserReturnType } from "@/backend/types/users/user.types";

export type { PermissionGroupReturnType } from "@/backend/types/permissions/permission-group.types";
export type { SafeUser, UserReturnType, UserSelectType } from "@/backend/types/users/user.types";

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
  data: UserReturnType[];
  pageInfo: PageInfo;
};

export type PaginatedUsersResponse = {
  data: UserReturnType[];
  pageInfo: PageInfo;
};

export type PermissionSelectType = typeof permissions.$inferSelect;
export type PermissionInsertType = typeof permissions.$inferInsert;

export type PermissionSubmitInput = Omit<PermissionInsertType, "id" | "createdAt" | "updatedAt">;

export type PermissionGroupSelectType = typeof permissionGroups.$inferSelect;
export type PermissionGroupInsertType = typeof permissionGroups.$inferInsert;

export type PermissionGroupSubmitInput = Omit<PermissionGroupInsertType, "id" | "createdAt" | "updatedAt">;

export type CurrentUserProfile = UserReturnType & {
  permissions: AppPermission[];
  notificationCount: number;
  role: UserRole;
  teacherId: string | null;
  parentId: string | null;
};

export type GroupPermissionSelectType = typeof groupPermissions.$inferSelect;
export type GroupPermissionInsertType = typeof groupPermissions.$inferInsert;

export type GroupPermissionSubmitInput = Omit<GroupPermissionInsertType, "id" | "createdAt" | "updatedAt">;

export type UserPermissionGroupSelectType = typeof userPermissionGroups.$inferSelect;
export type UserPermissionGroupInsertType = typeof userPermissionGroups.$inferInsert;

export type UserPermissionGroupSubmitInput = Omit<UserPermissionGroupInsertType, "id" | "createdAt" | "updatedAt">;

export type SessionSelectType = typeof sessions.$inferSelect;
export type SessionInsertType = typeof sessions.$inferInsert;

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

export type PasswordResetTokenSubmitInput = Omit<
  PasswordResetTokenInsertType,
  "id" | "createdAt" | "updatedAt" | "deletedAt"
>;

// Raw database types for AuthToken using Drizzle's $inferSelect
// Tokens table is not available in the schema, so we define types inline
export type AuthTokenSelectType = {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  status: string;
  deletedAt: Date | null;
  internalNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthTokenInsertType = {
  token: string;
  userId: string;
  expiresAt: Date;
  status: string;
};

/**
 * AuthTokenReturnType:
 * - Omits forbidden fields (e.g., deletedAt, internalNotes)
 * - Re-applies proper enums
 * - Adds resolved/computed fields
 */
export type AuthTokenReturnType = Omit<AuthTokenSelectType, "deletedAt" | "internalNotes"> & {
  /** Resolved/computed fields */
  userEmail?: string;
};

/**
 * AuthTokenSubmitInput:
 * - Input type for mutations/filters
 */
export type AuthTokenSubmitInput = {
  token: string;
  expiresAt: Date;
  userId: string;
  status?: AccountStatus;
};

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

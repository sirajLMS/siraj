import type {
  groupPermissions,
  passwordResetTokens,
  permissionGroups,
  permissions,
  sessions,
  userPermissionGroups,
  users,
} from "@/backend/db/schema";
import type { Email } from "@/backend/lib/email";
import type { PageInfo } from "./pagination.types";

export type UserEntity = typeof users.$inferSelect;
export type UserEntityInput = typeof users.$inferInsert;

export type UserPothosDefinition = UserEntity & {
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
  id: number;
  name: string;
  email: Email;
  password: string;
};

export type PaginatedUsersResponseSelectType = {
  data: UserEntity[];
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

export type PasswordResetTokenSelectType = typeof passwordResetTokens.$inferSelect;
export type PasswordResetTokenInsertInput = typeof passwordResetTokens.$inferInsert;

export type LoginInput = {
  email: Email;
  password: string;
};

export type LoginResponse = {
  user: UserPothosDefinition;
  token: string;
};

export type RefreshTokenResponse = {
  token: string;
  user: UserPothosDefinition;
};

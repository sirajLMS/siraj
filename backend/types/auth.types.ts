import type {
	passwordResetTokens,
	roles,
	sessions,
	userRoles,
	users,
} from "@/backend/db/schema";
import type { Email } from "@/backend/lib/email";
import type { PageInfo } from "./pagination.types";

export type UserEntity = typeof users.$inferSelect;
export type UserEntityInput = typeof users.$inferInsert;

export type UserPothosDefinition = UserEntity & {
	roles?: RolePothosDefinition[];
	userRoles?: UserRolePothosDefinition[];
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

// roles
export type RoleEntity = typeof userRoles.$inferSelect;
export type RoleEntityInput = typeof userRoles.$inferInsert;

export type RolePothosDefinition = RoleEntity & {
	users: UserPothosDefinition[];
	userRoles?: UserRolePothosDefinition[];
};

// user roles
export type UserRoleEntity = typeof roles.$inferSelect;
export type UserRoleEntityInput = typeof roles.$inferInsert;

export type UserRolePothosDefinition = UserRoleEntity & {
	user?: UserPothosDefinition;
	role?: RolePothosDefinition;
};

// sessions
export type SessionEntity = typeof sessions.$inferSelect;
export type SessionEntityInput = typeof sessions.$inferInsert;

export type SessionPothosDefinition = SessionEntity & {
	user?: UserPothosDefinition;
};

// password reset tokens
export type PasswordResetTokenSelectType =
	typeof passwordResetTokens.$inferSelect;
export type PasswordResetTokenInsertInput =
	typeof passwordResetTokens.$inferInsert;

// login
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

import type { users } from "@/backend/db/schema/users/users";
import type { AccountStatus, CurrencyCode, UserRole } from "@/backend/enum";
import type { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import type { PageInfo } from "@/backend/types/shared/pagination.types";

// Alias AccountStatus as UserStatus for canonical pattern compliance
// This aligns with the existing DB schema and UserStatus usage in the codebase
export type UserStatus = AccountStatus;

// Drizzle types
// Canonical: {Entity}SelectType and {Entity}InsertType must be derived from Drizzle
//--------------------------------------------------------------------------------
export type UserSelectType = typeof users.$inferSelect;
export type UserInsertType = typeof users.$inferInsert;

// Return type
// Canonical: {Entity}ReturnType must omit forbidden fields, re-apply enums, and add resolved optionals
//--------------------------------------------------------------------------------
export type UserReturnType = Omit<
  UserSelectType,
  | "deletedAt"
  | "internalNotes"
  | "role" // Re-apply enum
  | "status" // Re-apply enum
  | "timezone" // Re-apply enum
  | "displayCurrency" // Re-apply enum
> & {
  role: UserRole; // Re-apply enum
  status: UserStatus; // Re-apply enum
  timezone: IanaTimezone; // Re-apply enum
  displayCurrency: CurrencyCode | null; // Re-apply enum (nullable)
  teacherId?: string | null; // Resolved optional: teacherId if applies
  parentId?: string | null; // Resolved optional: parentId if applies
};

// Input types
// Canonical: {Entity}SubmitInput for mutations/filters
//--------------------------------------------------------------------------------
export type UserSubmitInput = Omit<UserInsertType, "id" | "createdAt" | "updatedAt" | "deletedAt">;

export type UserFilterInput = {
  role?: UserRole | UserRole[];
  status?: UserStatus | UserStatus[];
  email?: string;
};

// Add canonical UserUpdateSubmitInput for consistency with patterns
export type UserUpdateSubmitInput = Omit<UserSubmitInput, "email">;

export type SafeUser = Omit<UserReturnType, "password" | "rememberTokenHash">;

export type UserCreateInput = {
  name: string;
  email: { value: string };
  password: string;
  avatarUrl?: string | null;
};

/**
 * Shared core user-entity input collected by every create-user onboarding flow
 * (teacher / parent / student / manager). These are the fields that live on the
 * `users` table and are required to provision a login account.
 *
 * Per-type onboarding inputs compose this base and add their own type-specific
 * fields (e.g. teacher qualifications, parent invoice settings, student parent
 * assignment, manager account type).
 */
export type UserCreateCoreInput = {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly avatarUrl?: string | null;
};

/**
 * Optional user-entity profile fields that some onboarding flows write back to
 * the `users` row (timezone always lives on `users`; phone lives on `users` for
 * parents/managers but on the type-extension row for teachers/students).
 */
export type UserCreateProfileFieldsInput = {
  readonly phone?: string | null;
  readonly timezone?: string | null;
};

export type PaginatedUsersResponseSelectType = {
  data: UserReturnType[];
  pageInfo: PageInfo;
};

export type PaginatedUsersResponse = {
  data: UserReturnType[];
  pageInfo: PageInfo;
};

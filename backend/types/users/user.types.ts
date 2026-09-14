import type { users } from "@/backend/db/schema/users/users";
import type { AccountStatus, UserRole } from "@/backend/enum";
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import type { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

// Alias AccountStatus as UserStatus for canonical pattern compliance
// This aligns with the existing DB schema and UserStatus usage in the codebase
type UserStatus = AccountStatus;

// Drizzle types
// Canonical: {Entity}SelectType and {Entity}InsertType must be derived from Drizzle
//--------------------------------------------------------------------------------
export type UserSelectType = typeof users.$inferSelect;
export type UserInsertType = typeof users.$inferInsert;

/**
 * A `UserSelectType` guaranteed to carry no credential material. `password` and
 * `rememberTokenHash` are removed from the shape and typed as `never`, so any
 * attempt to assign a real value to either field fails to compile. Produced by
 * stripping the fields from `UserService.findSafeById` before the record is
 * stored on `BaseContext.safeUser` in `gqlContext.ts`.
 */
export type SanitizedUserSelectType = Omit<UserSelectType, "password" | "rememberTokenHash"> & {
  password?: never;
  rememberTokenHash?: never;
};

/**
 * Input accepted by user-to-return-type converters: either the full record
 * (credentials still present, stripped during conversion) or an already
 * sanitized record with credentials removed.
 */
export type UserReturnTypeInput = UserSelectType | SanitizedUserSelectType;

// Return type
// Canonical: {Entity}ReturnType must omit forbidden fields, re-apply enums, and add resolved optionals
//--------------------------------------------------------------------------------
export type UserReturnType = Omit<
  UserSelectType,
  | "deletedAt"
  | "internalNotes"
  | "password"
  | "rememberTokenHash"
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
  readonly displayCurrency?: string | null;
};

export interface GeneralUserCreateInput {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly phone?: string | null;
  readonly groupSlug: string;
  readonly status?: AccountStatus;
}

export interface GeneralUserCreateResult {
  readonly user: UserReturnType;
  readonly assignedGroupSlug: string;
}

import type { users } from "@/backend/db/schema/users";
import type { AccountStatus, UserRole } from "@/backend/enum";
import type { IanaTimezone } from "@/backend/enum/timezone.enum";
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
> & {
  role: UserRole; // Re-apply enum
  status: UserStatus; // Re-apply enum
  timezone: IanaTimezone; // Re-apply enum
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
};

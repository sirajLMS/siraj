import type { permissions } from "@/backend/db/schema/permissions/permissions";
import type { AppPermission, UserRole } from "@/backend/enum";
import type { LocalizedString } from "@/shared/types";

export type UserPermissionContext = {
  readonly permissions: AppPermission[];
  readonly permissionGroups: string[];
  readonly isSuperAdmin: boolean;
  readonly role: UserRole;
};

// Canonical: {Entity}SelectType and {Entity}InsertType must be derived from Drizzle
//--------------------------------------------------------------------------------
export type PermissionSelectType = typeof permissions.$inferSelect;
export type PermissionInsertType = typeof permissions.$inferInsert;

// Canonical: {Entity}ReturnType resolves JSONB `LocalizedString` maps to plain
// strings for the request locale. The permission catalog is read-only and
// consumed as flat strings across the frontend (search, grouping, listing).
//--------------------------------------------------------------------------------
export type PermissionReturnType = Omit<
  PermissionSelectType,
  "description" | "category" | "deletedAt" | "internalNotes"
> & {
  description: string;
  category: string;
};

// Input types
//--------------------------------------------------------------------------------
export type PermissionSubmitInput = Omit<PermissionInsertType, "id" | "createdAt" | "updatedAt" | "deletedAt">;

export type PermissionFilterInput = {
  key?: string | string[];
  groupId?: string | string[];
};

/** Input for bootstrapping immutable system permissions (seed / migration use). */
export type SystemPermissionUpsertInput = {
  readonly key: PermissionSelectType["key"];
  readonly resource: string;
  readonly action: string;
  readonly description: LocalizedString;
  readonly category: LocalizedString;
};

import type { permissions } from "@/backend/db/schema/permissions/permissions";
import type { AppPermission, UserRole } from "@/backend/enum";

export type UserPermissionContext = {
  readonly permissions: AppPermission[];
  readonly permissionGroups: string[];
  readonly isSuperAdmin: boolean;
  readonly role: UserRole;
};

// Canonical: {Entity}SelectType and {Entity}InsertType must be derived from Drizzle
//--------------------------------------------------------------------------------
export type PermissionSelectType = typeof permissions.$inferSelect;

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

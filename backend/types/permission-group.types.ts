import type { permissionGroups } from "@/backend/db/schema/permissions";

// Canonical: PermissionGroup types (moved from auth.types.ts)
export type PermissionGroupSelectType = typeof permissionGroups.$inferSelect;
export type PermissionGroupInsertType = typeof permissionGroups.$inferInsert;

/** Resolved for API/UI: name/description are flat strings for the request locale. */
export type PermissionGroupReturnType = Omit<
  PermissionGroupSelectType,
  "name" | "description" | "deletedAt" | "internalNotes"
> & {
  name: string;
  description: string | null;
};

// Input types
export type PermissionGroupSubmitInput = Omit<
  PermissionGroupInsertType,
  "id" | "createdAt" | "updatedAt" | "deletedAt"
>;

export type PermissionGroupFilterInput = {
  name?: string;
  isActive?: boolean;
};

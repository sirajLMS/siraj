import type { permissionGroups } from "@/backend/db/schema/permissions";

// Canonical: PermissionGroup types (moved from auth.types.ts)
export type PermissionGroupSelectType = typeof permissionGroups.$inferSelect;
export type PermissionGroupInsertType = typeof permissionGroups.$inferInsert;

export type PermissionGroupReturnType = Omit<PermissionGroupSelectType, "deletedAt" | "internalNotes">;

// Input types
export type PermissionGroupSubmitInput = Omit<
  PermissionGroupInsertType,
  "id" | "createdAt" | "updatedAt" | "deletedAt"
>;

export type PermissionGroupFilterInput = {
  name?: string;
  isActive?: boolean;
};

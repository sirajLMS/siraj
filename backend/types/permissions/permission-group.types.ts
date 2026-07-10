import type { permissionGroups } from "@/backend/db/schema/permissions/permissions";
import type { LocalizedString } from "@/backend/types/shared/localized-string.types";

// Canonical: PermissionGroup types (moved from auth.types.ts)
export type PermissionGroupSelectType = typeof permissionGroups.$inferSelect;
export type PermissionGroupInsertType = typeof permissionGroups.$inferInsert;

/**
 * Resolved for API/UI: name/description stay as the raw JSONB `LocalizedString`
 * map so the frontend can edit each locale independently. Resolution to a
 * single display string happens client-side via `resolveLocalizedString`.
 */
export type PermissionGroupReturnType = Omit<PermissionGroupSelectType, "deletedAt" | "internalNotes"> & {
  name: LocalizedString;
  description: LocalizedString | null;
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

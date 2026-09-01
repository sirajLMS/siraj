import type { permissionGroups } from "@/backend/db/schema/permissions/permissions";
import type { LocalizedString } from "@/shared/types";

// Canonical: PermissionGroup types (moved from auth.types.ts)
type PermissionGroupSelectType = typeof permissionGroups.$inferSelect;

/**
 * Resolved for API/UI: name/description stay as the raw JSONB `LocalizedString`
 * map so the frontend can edit each locale independently. Resolution to a
 * single display string happens client-side via `resolveLocalizedString`.
 */
export type PermissionGroupReturnType = Omit<PermissionGroupSelectType, "deletedAt" | "internalNotes"> & {
  name: LocalizedString;
  description: LocalizedString | null;
};

import type { permissions } from "@/backend/db/schema/permissions";
import type { LocalizedString } from "@/backend/types/shared/localized-string.types";

// Canonical: {Entity}SelectType and {Entity}InsertType must be derived from Drizzle
//--------------------------------------------------------------------------------
export type PermissionSelectType = typeof permissions.$inferSelect;
export type PermissionInsertType = typeof permissions.$inferInsert;

// Canonical: {Entity}ReturnType exposes the raw JSONB `LocalizedString` maps;
// clients resolve via `resolveLocalizedString` for display-only text.
//--------------------------------------------------------------------------------
export type PermissionReturnType = Omit<PermissionSelectType, "deletedAt" | "internalNotes"> & {
  description: LocalizedString;
  category: LocalizedString;
};

// Input types
//--------------------------------------------------------------------------------
export type PermissionSubmitInput = Omit<PermissionInsertType, "id" | "createdAt" | "updatedAt" | "deletedAt">;

export type PermissionFilterInput = {
  key?: string | string[];
  groupId?: string | string[];
};

export type { LocalizedString };

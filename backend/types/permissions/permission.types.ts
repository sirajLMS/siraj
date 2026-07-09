import type { permissions } from "@/backend/db/schema/permissions";
import type { LocalizedString } from "@/backend/types/shared/localized-string.types";

// Canonical: {Entity}SelectType and {Entity}InsertType must be derived from Drizzle
//--------------------------------------------------------------------------------
export type PermissionSelectType = typeof permissions.$inferSelect;
export type PermissionInsertType = typeof permissions.$inferInsert;

// Canonical: {Entity}ReturnType resolves localized JSONB maps to flat strings
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

export type { LocalizedString };

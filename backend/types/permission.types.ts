import type { permissions } from "@/backend/db/schema/permissions";

// Canonical: {Entity}SelectType and {Entity}InsertType must be derived from Drizzle
//--------------------------------------------------------------------------------
export type PermissionSelectType = typeof permissions.$inferSelect;
export type PermissionInsertType = typeof permissions.$inferInsert;

// Canonical: {Entity}ReturnType must omit forbidden fields and re-apply enums
//--------------------------------------------------------------------------------
export type PermissionReturnType = Omit<PermissionSelectType, "deletedAt" | "internalNotes">;

// Input types
//--------------------------------------------------------------------------------
export type PermissionSubmitInput = Omit<PermissionInsertType, "id" | "createdAt" | "updatedAt" | "deletedAt">;

export type PermissionFilterInput = {
  key?: string | string[];
  groupId?: string | string[];
};

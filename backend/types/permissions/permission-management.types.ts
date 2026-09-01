import type { userPermissionOverrides } from "@/backend/db/schema";
import type { OverrideState } from "@/backend/enum";
import type { PermissionGroupReturnType, UserReturnType } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale/types/errors";
import type { LocalizedString } from "@/shared/types";

export type UserPermissionOverrideSelectType = typeof userPermissionOverrides.$inferSelect;

export type UserOverrideReturnType = Omit<UserPermissionOverrideSelectType, "state"> & {
  state: OverrideState;
};

export type GroupWithPermissionIds = PermissionGroupReturnType & {
  permissionIds: string[];
  assignedUsers: GroupUserEntity[];
};

export type CreateGroupInput = {
  name: LocalizedString;
  slug: string;
  description?: LocalizedString | null;
  isSystem?: boolean;
  createdByUserId?: string | null;
  permissionIds: string[];
};

export type UpdateGroupInput = Partial<Omit<PermissionGroupReturnType, "id" | "createdAt" | "updatedAt">> & {
  readonly id: string;
  permissionIds?: string[];
};

export type UserOverrideInput = {
  permissionId: string;
  state: OverrideState;
};

export type GroupUserEntity = Pick<UserReturnType, "id" | "name" | "email">;

export type PermissionCtx = { user?: { id: string } | null };

export type GroupMembershipInput = { userId: string; groupId: string };

export type BulkGroupMembershipInput = { userIds: string[]; groupId: string };

/**
 * Minimal interface for accessing localized error translations via `ctx.t().errorsTranslations`.
 * Used by permission management resolvers to decouple from the full context type.
 */
export interface ErrorsTranslationsHolder {
  t(): { errorsTranslations: ErrorsLabels };
}

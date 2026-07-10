import type { userPermissionOverrides } from "@/backend/db/schema";
import type { OverrideState } from "@/backend/enum";
import type { PermissionGroupReturnType } from "@/backend/types/permissions/permission-group.types";
import type { LocalizedString } from "@/backend/types/shared/localized-string.types";
import type { UserReturnType } from "@/backend/types/users/user.types";

export type UserOverrideEntity = typeof userPermissionOverrides.$inferSelect;
export type UserPermissionOverrideEntityInput = typeof userPermissionOverrides.$inferInsert;

export type UserOverrideReturnType = Omit<UserOverrideEntity, "state"> & {
  state: OverrideState;
};

export type GroupWithPermissionIds = PermissionGroupReturnType & {
  permissionIds: string[];
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

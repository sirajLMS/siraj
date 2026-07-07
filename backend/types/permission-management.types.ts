import type { userPermissionOverrides } from "@/backend/db/schema";
import type { OverrideState } from "@/shared/lib/enum";
import type { PermissionGroupReturnType } from "./permission-group.types";
import type { UserReturnType } from "./user.types";

export type UserOverrideEntity = typeof userPermissionOverrides.$inferSelect;
export type UserPermissionOverrideEntityInput = typeof userPermissionOverrides.$inferInsert;

export type UserOverrideReturnType = Omit<UserOverrideEntity, "state"> & {
  state: OverrideState;
};

export type GroupWithPermissionIds = PermissionGroupReturnType & {
  permissionIds: string[];
};

export type CreateGroupInput = Omit<PermissionGroupReturnType, "id" | "createdAt" | "updatedAt"> & {
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

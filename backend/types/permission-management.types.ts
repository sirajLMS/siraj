import type { userPermissionOverrides, users } from "@/backend/db/schema";
import type { OverrideState } from "@/shared/lib/enum";
import type { PermissionGroupEntity, PermissionGroupEntityInput } from "./auth.types";

export type UserOverrideEntity = typeof userPermissionOverrides.$inferSelect;
export type UserPermissionOverrideEntityInput = typeof userPermissionOverrides.$inferInsert;

export type UserOverrideReturnType = Omit<UserOverrideEntity, "state"> & {
  state: OverrideState;
};

export type GroupWithPermissionIds = PermissionGroupEntity & {
  permissionIds: string[];
};

export type CreateGroupInput = Omit<PermissionGroupEntityInput, "id" | "createdAt" | "updatedAt"> & {
  permissionIds: string[];
};

export type UpdateGroupInput = Partial<Omit<PermissionGroupEntityInput, "id" | "createdAt" | "updatedAt">> & {
  readonly id: string;
  permissionIds?: string[];
};

export type UserOverrideInput = {
  permissionId: string;
  state: OverrideState;
};

export type GroupUserEntity = Pick<typeof users.$inferSelect, "id" | "name" | "email">;

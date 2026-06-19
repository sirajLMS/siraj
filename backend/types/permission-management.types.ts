import type { userPermissionOverrides, users } from "@/backend/db/schema";
import type { PermissionGroupEntity, PermissionGroupEntityInput } from "./auth.types";

export type PermissionGroupEntitySelect = PermissionGroupEntity;
export type PermissionGroupEntityInsert = PermissionGroupEntityInput;

export type UserOverrideEntity = typeof userPermissionOverrides.$inferSelect;
export type UserPermissionOverrideEntityInput = typeof userPermissionOverrides.$inferInsert;

export type GroupWithPermissionIds = PermissionGroupEntity & {
  permissionIds: string[];
};

export type CreateGroupInput = Omit<PermissionGroupEntityInput, "createdAt" | "updatedAt"> & {
  permissionIds: string[];
};

export type UpdateGroupInput = Partial<Omit<PermissionGroupEntityInput, "createdAt" | "updatedAt">> & {
  id: string;
  permissionIds?: string[];
};

export type UserOverrideInput = {
  permissionId: string;
  state: "GRANTED" | "DENIED";
};

export type GroupUserEntity = Pick<typeof users.$inferSelect, "id" | "name" | "email">;

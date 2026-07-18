// NEW FOR PLAN v5 (newly created for the migration wave)
import type { Permission, PermissionGroup, User } from "@/frontend/common/graphql/generated/gql/graphql-types";

export type PermissionTabKey = "groups" | "catalog" | "overrides";

export interface PermissionTabContentProps {
  readonly activeTab: PermissionTabKey;
  readonly isLoading: boolean;
  readonly permissions: readonly Permission[];
  readonly groups: readonly PermissionGroup[];
  readonly users: readonly User[];
  readonly setSelectedGroupId: (id: string | null) => void;
  readonly openEditDialog: (id: string) => void;
  readonly openDeleteDialog: (id: string) => void;
  readonly openAssignDialog: (id: string) => void;
  readonly openManageOverrides: () => void;
  readonly setSelectedUserIdForOverrides: (id: string | null) => void;
}

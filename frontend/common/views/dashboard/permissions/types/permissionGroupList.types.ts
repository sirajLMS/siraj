// NEW FOR PLAN v5 (newly created for the migration wave)
import type { PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";

export interface BasePermissionGroupListProps {
  readonly groups: readonly PermissionGroup[];
  readonly onViewGroup: (id: string) => void;
  readonly onEditGroup: (id: string) => void;
  readonly onDeleteGroup: (id: string) => void;
  readonly onAssignGroup: (id: string) => void;
}

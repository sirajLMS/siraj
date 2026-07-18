// NEW FOR PLAN v5 (newly created for the migration wave)
import type { PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { RowMenuAnchor } from "@/frontend/common/views/dashboard/permissions/components/useRowMenuAnchor";

export interface BasePermissionGroupListProps {
  readonly groups: readonly PermissionGroup[];
  readonly onViewGroup: (id: string) => void;
  readonly onEditGroup: (id: string) => void;
  readonly onDeleteGroup: (id: string) => void;
  readonly onAssignGroup: (id: string) => void;
  // NEW FOR PLAN v5: shared row-menu anchor for the group list popover (NS-3
  // N7 lift). The tier card/grid row components receive `{ anchorEl, openMenu,
  // closeMenu }` callbacks as plain props instead of calling `useState` for
  // the popover anchor themselves.
  readonly groupRowMenuAnchor: RowMenuAnchor;
}

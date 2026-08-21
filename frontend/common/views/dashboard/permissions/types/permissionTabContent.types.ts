// NEW FOR PLAN v5 (newly created for the migration wave)
import type {
  PermissionsQuery_permissions as Permission,
  PermissionGroupDetailFieldsFragment as PermissionGroup,
  UsersQuery_users as User,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { PermissionCatalogFilterResult } from "@/frontend/common/views/dashboard/permissions/components/usePermissionCatalogFilter";
import type { RowMenuAnchor } from "@/frontend/common/views/dashboard/permissions/components/useRowMenuAnchor";
import type { PermissionsLabels } from "@/shared/locale";

export type PermissionTabKey = "groups" | "catalog" | "overrides";

export interface PermissionTabContentProps {
  readonly labels: PermissionsLabels;
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
  // NEW FOR PLAN v5: catalog filter bindings produced by the ViewModel from the
  // common `usePermissionCatalogFilter` hook (NS-2 — lift of useState +
  // useMemo derivation out of tier `permissionCatalogSection.*.tsx`).
  readonly catalogFilter: PermissionCatalogFilterResult;
  // NEW FOR PLAN v5: shared row-menu anchor for the group list popover (NS-3
  // N7 lift). The ViewModel owns a single shared `useRowMenuAnchor()` because
  // only one row popover is open at a time across the list — the tier
  // card/grid row components receive `{ anchorEl, openMenu, closeMenu }` as
  // plain props instead of calling `useState` themselves.
  readonly groupRowMenuAnchor: RowMenuAnchor;
}

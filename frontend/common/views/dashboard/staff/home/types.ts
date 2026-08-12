import type { ManagerDirectoryMetrics as GeneratedManagerDirectoryMetrics } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { ManagerRoleFilter, ManagerStatusFilter } from "@/frontend/common/types/shared.types";
import type { StaffDirectoryLabels } from "@/shared/locale";

export type ManagerRole = "admin" | "staff" | "supervisor";

export type ManagerStatus = "active" | "offline";

export type NonNullableManagerDirectoryMetrics = {
  [K in keyof Omit<GeneratedManagerDirectoryMetrics, "__typename">]: NonNullable<GeneratedManagerDirectoryMetrics[K]>;
};

export interface Manager {
  readonly userId: string;
  readonly staffProfileId: string;
  readonly name: string;
  readonly role: ManagerRole;
  readonly status: ManagerStatus;
  readonly email: string;
  readonly phone: string;
  readonly avatarUrl: string;
  readonly targetIsSuperAdmin: boolean;
}

// NEW FOR PLAN v5: unified ManagersViewProps (was duplicated as `ManagersViewMobileProps`/`ManagersViewDesktopProps` paired interfaces in tier — Class B unified original per specs §4.1).
export interface ManagersViewProps {
  readonly labels: StaffDirectoryLabels;
  readonly managers: readonly Manager[];
  readonly metrics: NonNullableManagerDirectoryMetrics;
  readonly totalManagers?: number;
  readonly loading?: boolean;
  readonly page?: number;
  readonly pageSize?: number;
  readonly onPageChange?: (page: number) => void;
  readonly roleFilter: ManagerRoleFilter;
  readonly statusFilter: ManagerStatusFilter;
  readonly onRoleFilterChange: (role: ManagerRoleFilter) => void;
  readonly onStatusFilterChange: (status: ManagerStatusFilter) => void;
  // NEW FOR PLAN v5: canCreateManager exposed by the Container VM so the tier views no longer wrap a RequirePermission around the action button (was N3 violation).
  readonly canCreateManager: boolean;
}

// NEW FOR PLAN v5: shared base for the card-list (mobile) / data-grid (desktop) twins (Class C per specs §4.3).
export interface BaseManagersListProps {
  readonly labels: StaffDirectoryLabels;
  readonly managers: readonly Manager[];
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
}

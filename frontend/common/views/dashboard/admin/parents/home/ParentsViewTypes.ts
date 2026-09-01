import { AccountStatus, ParentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { ParentsDirectoryLabelsBySection } from "@/frontend/common/views/dashboard/admin/parents/home/types/parentsDirectory.types";
import type { ParentLifecycleStatus as BaseParentLifecycleStatus } from "@/frontend/common/views/dashboard/types/parent.types";

export type ParentLifecycleStatus = BaseParentLifecycleStatus;
export type ParentAccountStatusKey = "activated" | "deactivated";

const VALID_LIFECYCLE_STATUSES: ReadonlySet<string> = new Set(
  Object.values(ParentStatus).map(value => value.toLowerCase())
);

function isParentLifecycleStatus(value: string): value is ParentLifecycleStatus {
  return VALID_LIFECYCLE_STATUSES.has(value);
}

export function toParentLifecycleStatus(status: ParentStatus): ParentLifecycleStatus {
  const lower = status.toLowerCase();
  return isParentLifecycleStatus(lower) ? lower : "regular";
}

export function toParentAccountStatusKey(status: AccountStatus | null | undefined): ParentAccountStatusKey {
  return status === AccountStatus.Deactivated ? "deactivated" : "activated";
}

export interface ParentDirectoryRow {
  readonly id: string;
  readonly userId: string;
  readonly index: number;
  readonly name: string;
  readonly email: string;
  readonly avatarUrl?: string;
  readonly guardianOf: string;
  readonly time: string;
  readonly lifecycleStatus: ParentLifecycleStatus;
  readonly accountStatus: ParentAccountStatusKey;
  readonly unpaidInvoices: number;
}

export interface ParentCardListLabels {
  readonly guardianOf: (name: string) => string;
  readonly unpaidCount: (count: number) => string;
  readonly invoicesCleared: string;
  readonly statusLabels: Record<ParentLifecycleStatus, string>;
  readonly accountStatusLabels: Record<ParentAccountStatusKey, string>;
}

export interface ParentsDataGridLabels {
  readonly index: string;
  readonly image: string;
  readonly name: string;
  readonly email: string;
  readonly time: string;
  readonly status: string;
  readonly accountStatus: string;
  readonly unpaidInvoices: string;
  readonly unpaidCount: (count: number) => string;
  readonly invoicesCleared: string;
  readonly options: string;
  readonly noEntries: string;
  readonly statusLabels: Record<ParentLifecycleStatus, string>;
  readonly accountStatusLabels: Record<ParentAccountStatusKey, string>;
  readonly manageLifecycle: string;
}

export interface ParentsViewModel extends BaseParentsViewProps {
  // NEW FOR PLAN v5: desktop variant adds `loading?` — mobile omits (uses sentinel rows / skeleton-in-list).
  // BaseParentsViewProps already carries metrics, rows, labelsBySection, pagination, handlers, and permission booleans.
  readonly loading?: boolean;
}

// NEW FOR PLAN v5: BaseParentsViewProps lifted per specs.md §4.1 Class C — desktop variant adds `loading?: boolean`
// that the mobile variant omits (mobile uses sentinel rows / skeleton-in-list). Each tier interface extends this base
// and tags itself with `// VARIANT JUSTIFICATION: extra field <name>` per §3 allowance table.
export interface BaseParentsViewProps {
  readonly metrics: readonly MetricItem[];
  readonly rows: readonly ParentDirectoryRow[];
  readonly labelsBySection: ParentsDirectoryLabelsBySection;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly lifecycleStatusFilter: ParentStatus | null;
  readonly filterPanelOpen: boolean;
  readonly onAddParent: () => void;
  readonly onOpenSettings: (id: string) => void;
  readonly onSearch: (query: string) => void;
  readonly onPageChange?: (page: number) => void;
  readonly onFilter: () => void;
  readonly onExport: () => void;
  readonly onLifecycleStatusFilterChange: (status: ParentStatus | null) => void;
  readonly onResetFilters: () => void;
  // NEW FOR PLAN v5: lifted permission booleans consumed by the tier views
  // instead of `RequirePermission` wrappers (specs.md §3 N3).
  readonly canParentsCreate: boolean;
  readonly canParentManageStatus: boolean;
}

export type UseParentsViewModelProps = Record<string, never>;

export interface ParentDirectoryExportLabels {
  readonly pageTitle: string;
  readonly table: {
    readonly index: string;
    readonly name: string;
    readonly email: string;
    readonly time: string;
    readonly status: string;
    readonly unpaidInvoices: string;
    readonly statusLabels: Record<string, string>;
  };
}

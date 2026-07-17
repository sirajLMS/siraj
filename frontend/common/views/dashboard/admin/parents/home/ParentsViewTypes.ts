import { AccountStatus, type ParentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { MetricItem } from "@/frontend/common/views/dashboard/types/dashboard";
import type { ParentLifecycleStatus as BaseParentLifecycleStatus } from "@/frontend/common/views/dashboard/types/parent.types";
import type { ParentsDirectoryLabels } from "@/shared/locale/types/dashboard/parents";

export type ParentLifecycleStatus = BaseParentLifecycleStatus;
export type ParentAccountStatusKey = "activated" | "deactivated";

export function toParentLifecycleStatus(status: ParentStatus): ParentLifecycleStatus {
  return status.toLowerCase() as ParentLifecycleStatus;
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
  readonly options: string;
  readonly noEntries: string;
  readonly guardianOf: (name: string) => string;
  readonly statusLabels: Record<ParentLifecycleStatus, string>;
  readonly accountStatusLabels: Record<ParentAccountStatusKey, string>;
  readonly manageLifecycle: string;
}

export interface ParentsViewLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly searchPlaceholder: string;
  readonly addParent: string;
  readonly records: string;
  readonly filterLabel: string;
  readonly clearFilters: string;
  readonly table: ParentsDirectoryLabels["table"];
  readonly card: ParentsDirectoryLabels["card"];
  readonly statusLabels: Record<ParentLifecycleStatus, string>;
  readonly accountStatusLabels: Record<ParentAccountStatusKey, string>;
}

export interface ParentsViewModel {
  readonly metrics: readonly MetricItem[];
  readonly rows: readonly ParentDirectoryRow[];
  readonly labels: ParentsViewLabels;
  readonly loading?: boolean;
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

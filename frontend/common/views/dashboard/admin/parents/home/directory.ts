import { AccountStatus, type ParentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { ParentLifecycleStatus } from "@/frontend/common/views/dashboard/types/parent.types";

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
  readonly statusLabels: Record<ParentLifecycleStatus, string>;
  readonly accountStatusLabels: Record<ParentAccountStatusKey, string>;
  readonly manageLifecycle: string;
}

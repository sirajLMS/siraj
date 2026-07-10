import { AccountStatus, type ParentStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import type { ParentLifecycleStatus } from "@/frontend/views/dashboard/types/parent.types";

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

import type { ParentStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import type { ParentLifecycleStatus } from "@/frontend/views/dashboard/types/parent.types";

export function toParentLifecycleStatus(status: ParentStatus): ParentLifecycleStatus {
  return status.toLowerCase() as ParentLifecycleStatus;
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
  readonly unpaidInvoices: number;
}

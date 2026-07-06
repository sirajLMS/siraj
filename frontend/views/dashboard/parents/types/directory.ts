import type { ParentStatus } from "@/frontend/graphql/generated/gql/graphql-types";

export type ParentAccountStatus = Lowercase<ParentStatus>;

export function toParentAccountStatus(status: ParentStatus): ParentAccountStatus {
  return status.toLowerCase() as ParentAccountStatus;
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
  readonly accountStatus: ParentAccountStatus;
  readonly unpaidInvoices: number;
}

import { BlockOutlined, EventBusyOutlined, TimerOutlined, VerifiedUserOutlined } from "@mui/icons-material";
import type { AccountStatus, ParentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import {
  type ParentDirectoryRow,
  toParentAccountStatusKey,
  toParentLifecycleStatus,
} from "@/frontend/common/views/dashboard/admin/parents/home/ParentsViewTypes";

export function useDirectoryMetrics(
  directory: {
    readonly metrics?: {
      readonly regular?: number | null;
      readonly onLeave?: number | null;
      readonly suspended?: number | null;
      readonly onTrial?: number | null;
    } | null;
  } | null
): readonly MetricItem[] {
  const m = directory?.metrics;
  if (!m) return [];
  return [
    {
      key: "regular",
      count: m.regular ?? 0,
      labelKey: "dashboard.parentsDirectory.metrics.regular",
      icon: VerifiedUserOutlined,
    },
    {
      key: "on_leave",
      count: m.onLeave ?? 0,
      labelKey: "dashboard.parentsDirectory.metrics.onLeave",
      icon: EventBusyOutlined,
    },
    {
      key: "suspended",
      count: m.suspended ?? 0,
      labelKey: "dashboard.parentsDirectory.metrics.suspended",
      icon: BlockOutlined,
    },
    {
      key: "on_trial",
      count: m.onTrial ?? 0,
      labelKey: "dashboard.parentsDirectory.metrics.onTrial",
      icon: TimerOutlined,
    },
  ];
}

export function useDirectoryRows(
  directory: {
    readonly rows?:
      | readonly {
          readonly id?: string | null;
          readonly userId?: string | null;
          readonly index?: number | null;
          readonly name?: string | null;
          readonly email?: string | null;
          readonly avatarUrl?: string | null;
          readonly guardianOf?: string | null;
          readonly time?: string | null;
          readonly lifecycleStatus?: ParentStatus | null;
          readonly accountStatus?: AccountStatus | null;
          readonly unpaidInvoices?: number | null;
        }[]
      | null;
  } | null
): readonly ParentDirectoryRow[] {
  return (directory?.rows ?? []).map(row => ({
    id: row.id ?? "",
    userId: row.userId ?? "",
    index: row.index ?? 0,
    name: row.name ?? "",
    email: row.email ?? "",
    avatarUrl: row.avatarUrl ?? undefined,
    guardianOf: row.guardianOf ?? "",
    time: row.time ?? "",
    lifecycleStatus: row.lifecycleStatus ? toParentLifecycleStatus(row.lifecycleStatus) : "regular",
    accountStatus: toParentAccountStatusKey(row.accountStatus),
    unpaidInvoices: row.unpaidInvoices ?? 0,
  }));
}

type ParentDirectoryQueryVariables = {
  readonly search: string | null;
  readonly lifecycleStatusFilter: ParentStatus | null;
  readonly paginationArgs: {
    readonly first: number;
    readonly page: number;
    readonly skip: null;
    readonly after: null;
    readonly before: null;
    readonly last: null;
    readonly maxCount: null;
  };
};

export function buildDirectoryQueryVariables(
  searchQuery: string,
  pageSize: number,
  page: number,
  lifecycleStatusFilter: ParentStatus | null
): ParentDirectoryQueryVariables {
  return {
    search: searchQuery || null,
    lifecycleStatusFilter: lifecycleStatusFilter ?? null,
    paginationArgs: {
      first: pageSize,
      page: page + 1,
      skip: null,
      after: null,
      before: null,
      last: null,
      maxCount: null,
    },
  };
}

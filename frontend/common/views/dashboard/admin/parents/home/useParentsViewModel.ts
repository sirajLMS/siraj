"use client";

import { useQuery } from "@apollo/client/react";
import { BlockOutlined, EventBusyOutlined, TimerOutlined, VerifiedUserOutlined } from "@mui/icons-material";
import { useCallback } from "react";
import type { AccountStatus, ParentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { parentDirectoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments/parents/parent-directory.documents";
import { useParentsStore } from "@/frontend/common/stores/parentsStore";
import { exportParentDirectory } from "@/frontend/common/utils/excel-export/parent-directory-export";
import { profileHrefForParent } from "@/frontend/common/utils/profileHref";
import {
  type ParentAccountStatusKey,
  type ParentDirectoryExportLabels,
  type ParentDirectoryRow,
  type ParentLifecycleStatus,
  type ParentsViewLabels,
  type ParentsViewModel,
  toParentAccountStatusKey,
  toParentLifecycleStatus,
} from "@/frontend/common/views/dashboard/admin/parents/home/ParentsViewTypes";
import type { MetricItem } from "@/frontend/common/views/dashboard/types/dashboard";
import { useRouter } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale";
import type { ParentsDirectoryLabels } from "@/shared/locale/types/dashboard/parents";

function useDirectoryMetrics(
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

function useDirectoryRows(
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

function useDirectoryLabels(t: ParentsDirectoryLabels): ParentsViewLabels {
  const statusLabels: Record<ParentLifecycleStatus, string> = {
    regular: t.metrics.regular,
    on_leave: t.metrics.onLeave,
    suspended: t.metrics.suspended,
    on_trial: t.metrics.onTrial,
  };

  const accountStatusLabels: Record<ParentAccountStatusKey, string> = {
    activated: t.accountStatus.activated,
    deactivated: t.accountStatus.deactivated,
  };

  return {
    pageTitle: t.pageTitle,
    pageSubtitle: t.pageSubtitle,
    addParent: t.actions.addParent,
    records: t.records,
    searchPlaceholder: t.searchPlaceholder,
    filterLabel: t.actions.filter,
    clearFilters: t.actions.clearFilters,
    table: t.table,
    card: t.card,
    statusLabels,
    accountStatusLabels,
  };
}

export type UseParentsViewModelProps = Record<string, never>;

export function useParentsViewModel(_props: Readonly<UseParentsViewModelProps>): ParentsViewModel {
  const t = useAppTranslation().dashboardTranslations.parentsDirectory;
  const router = useRouter();

  const {
    searchQuery,
    page,
    pageSize,
    lifecycleStatusFilter,
    filterPanelOpen,
    setSearchQuery,
    setPage,
    setLifecycleStatusFilter,
    setFilterPanelOpen,
    resetFilters,
  } = useParentsStore();

  const { data, loading } = useQuery(parentDirectoryQueryDocument, {
    variables: {
      search: searchQuery || null,
      lifecycleStatusFilter: lifecycleStatusFilter || null,
      paginationArgs: {
        first: pageSize,
        page: page + 1,
        skip: null,
        after: null,
        before: null,
        last: null,
        maxCount: null,
      },
    },
    fetchPolicy: "cache-and-network",
  });

  const directory = data?.parentDirectory;
  const metrics = useDirectoryMetrics(directory ?? null);
  const rows = useDirectoryRows(directory ?? null);
  const labels = useDirectoryLabels(t);

  const handleAddParent = () => {
    router.push("/parents/onboarding");
  };

  const handleOpenSettings = (id: string) => {
    const row = rows.find(r => r.id === id);
    const href = profileHrefForParent({ userId: row?.userId, parentId: id });
    if (href) {
      router.push(href);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
    },
    [setPage]
  );

  const handleFilter = useCallback(() => {
    setFilterPanelOpen(!filterPanelOpen);
  }, [filterPanelOpen, setFilterPanelOpen]);

  const handleExport = useCallback(() => {
    const exportLabels: ParentDirectoryExportLabels = {
      pageTitle: labels.pageTitle,
      table: {
        index: labels.table.index,
        name: labels.table.name,
        email: labels.table.email,
        time: labels.table.time,
        status: labels.table.status,
        unpaidInvoices: labels.table.unpaidInvoices,
        statusLabels: labels.statusLabels,
      },
    };
    void exportParentDirectory({ rows, labels: exportLabels });
  }, [rows, labels]);

  return {
    metrics,
    rows,
    labels,
    loading,
    page,
    pageSize,
    totalCount: directory ? (directory.totalCount ?? 0) : undefined,
    lifecycleStatusFilter,
    filterPanelOpen,
    onAddParent: handleAddParent,
    onOpenSettings: handleOpenSettings,
    onSearch: handleSearch,
    onPageChange: handlePageChange,
    onFilter: handleFilter,
    onExport: handleExport,
    onLifecycleStatusFilterChange: setLifecycleStatusFilter,
    onResetFilters: resetFilters,
  };
}

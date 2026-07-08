"use client";

import { useQuery } from "@apollo/client/react";
import {
  BlockOutlined,
  CancelOutlined,
  EventBusyOutlined,
  HowToRegOutlined,
  TimerOutlined,
  VerifiedUserOutlined,
} from "@mui/icons-material";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission, type ParentStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import { parentDirectoryQueryDocument } from "@/frontend/graphql/sharedDocuments/parent-directory.documents";
import { useParentsStore } from "@/frontend/stores/parentsStore";
import { exportParentDirectory } from "@/frontend/utils/excel-export/parent-directory-export";
import { profileHrefForParent } from "@/frontend/utils/profileHref";
import type { ParentAccountStatus } from "@/frontend/views/dashboard/types/parent.types";
import { useRouter } from "@/shared/i18n/routing";
import { toParentAccountStatus } from "./directory";
import { ParentsView } from "./ParentsView";

function useDirectoryMetrics(
  directory: {
    readonly metrics?: {
      readonly activated?: number | null;
      readonly deactivated?: number | null;
      readonly regular?: number | null;
      readonly onLeave?: number | null;
      readonly suspended?: number | null;
      readonly onTrial?: number | null;
    } | null;
  } | null
) {
  const m = directory?.metrics;
  if (!m) return [];
  return [
    {
      key: "activated",
      count: m.activated ?? 0,
      labelKey: "dashboard.parentsDirectory.metrics.activated",
      icon: HowToRegOutlined,
    },
    {
      key: "deactivated",
      count: m.deactivated ?? 0,
      labelKey: "dashboard.parentsDirectory.metrics.deactivated",
      icon: CancelOutlined,
    },
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
          readonly accountStatus?: ParentStatus | null;
          readonly unpaidInvoices?: number | null;
        }[]
      | null;
  } | null
) {
  return (directory?.rows ?? []).map(row => ({
    id: row.id ?? "",
    userId: row.userId ?? "",
    index: row.index ?? 0,
    name: row.name ?? "",
    email: row.email ?? "",
    avatarUrl: row.avatarUrl ?? undefined,
    guardianOf: row.guardianOf ?? "",
    time: row.time ?? "",
    accountStatus: row.accountStatus ? toParentAccountStatus(row.accountStatus) : "regular",
    unpaidInvoices: row.unpaidInvoices ?? 0,
  }));
}

function useDirectoryLabels(t: ReturnType<typeof useTranslations<"dashboard.parentsDirectory">>) {
  const statusLabels = {
    activated: t("metrics.activated"),
    deactivated: t("metrics.deactivated"),
    regular: t("metrics.regular"),
    on_leave: t("metrics.onLeave"),
    suspended: t("metrics.suspended"),
    on_trial: t("metrics.onTrial"),
  } as Record<ParentAccountStatus, string>;

  return {
    pageTitle: t("pageTitle"),
    pageSubtitle: t("pageSubtitle"),
    addParent: t("actions.addParent"),
    records: t("records"),
    searchPlaceholder: t("searchPlaceholder"),
    filterLabel: t("actions.filter"),
    clearFilters: t("actions.clearFilters"),
    statusLabels,
    table: {
      index: t("table.index"),
      image: t("table.image"),
      name: t("table.name"),
      email: t("table.email"),
      time: t("table.time"),
      status: t("table.status"),
      unpaidInvoices: t("table.unpaidInvoices"),
      options: t("table.options"),
      noEntries: t("noEntries"),
      guardianOf: (name: string) => t("card.guardianOf", { name }),
      statusLabels,
    },
    card: {
      guardianOf: (name: string) => t("card.guardianOf", { name }),
      unpaidCount: (count: number) => t("card.unpaidCount", { count }),
      invoicesCleared: t("card.invoicesCleared"),
      statusLabels,
    },
  };
}

export function ParentsContainer() {
  const t = useTranslations("dashboard.parentsDirectory");
  const router = useRouter();
  const {
    searchQuery,
    page,
    pageSize,
    statusFilter,
    filterPanelOpen,
    setSearchQuery,
    setPage,
    setStatusFilter,
    setFilterPanelOpen,
    resetFilters,
  } = useParentsStore();

  const { data } = useQuery(parentDirectoryQueryDocument, {
    variables: {
      search: searchQuery || null,
      statusFilter: statusFilter || null,
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
    void exportParentDirectory({ rows, labels });
  }, [rows, labels]);

  return (
    <RequirePermission permissions={[AppPermission.ParentViewDirectory]}>
      <ParentsView
        metrics={metrics}
        rows={rows}
        labels={labels}
        page={page}
        pageSize={pageSize}
        totalCount={directory?.totalCount ?? 0}
        statusFilter={statusFilter}
        filterPanelOpen={filterPanelOpen}
        onAddParent={handleAddParent}
        onOpenSettings={handleOpenSettings}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onFilter={handleFilter}
        onExport={handleExport}
        onStatusFilterChange={setStatusFilter}
        onResetFilters={resetFilters}
      />
    </RequirePermission>
  );
}

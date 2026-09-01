"use client";

import { useQuery } from "@apollo/client/react";
import { BlockOutlined, EventBusyOutlined, TimerOutlined, VerifiedUserOutlined } from "@mui/icons-material";
import { useCallback } from "react";
import { type AccountStatus, AppPermission, type ParentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { parentDirectoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments/parents/parent-directory.documents";
import { useParentsStore } from "@/frontend/common/stores/parentsStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import { exportParentDirectory } from "@/frontend/common/utils/excel-export/parent-directory-export";
import { profileHrefForParent } from "@/frontend/common/utils/profileHref";
import {
  type ParentAccountStatusKey,
  type ParentDirectoryExportLabels,
  type ParentDirectoryRow,
  type ParentLifecycleStatus,
  type ParentsViewModel,
  toParentAccountStatusKey,
  toParentLifecycleStatus,
} from "@/frontend/common/views/dashboard/admin/parents/home/ParentsViewTypes";
import type { ParentsDirectoryLabelsBySection } from "@/frontend/common/views/dashboard/admin/parents/home/types/parentsDirectory.types";
import { useRouter } from "@/shared/i18n/navigation";
import { Translation, useAppTranslation } from "@/shared/locale";
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

function buildLabelsBySection(t: ParentsDirectoryLabels): ParentsDirectoryLabelsBySection {
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
    shell: {
      pageTitle: t.pageTitle,
      pageSubtitle: t.pageSubtitle,
      records: t.records,
      noEntries: t.noEntries,
    },
    filters: {
      searchPlaceholder: t.searchPlaceholder,
      filterLabel: t.actions.filter,
      clearFilters: t.actions.clearFilters,
      statusLabels,
    },
    columns: {
      index: t.table.index,
      image: t.table.image,
      name: t.table.name,
      email: t.table.email,
      time: t.table.time,
      status: t.table.status,
      accountStatus: t.table.accountStatus,
      unpaidInvoices: t.table.unpaidInvoices,
      unpaidCount: t.card.unpaidCount,
      invoicesCleared: t.card.invoicesCleared,
      options: t.table.options,
      noEntries: t.noEntries,
      statusLabels,
      accountStatusLabels,
      manageLifecycle: t.actions.manageLifecycle,
    },
    card: {
      guardianOf: t.card.guardianOf,
      unpaidCount: t.card.unpaidCount,
      invoicesCleared: t.card.invoicesCleared,
      statusLabels,
      accountStatusLabels,
    },
    actions: {
      addParent: t.actions.addParent,
      export: t.actions.export,
      manageLifecycle: t.actions.manageLifecycle,
      accountStatusLabels,
    },
  };
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

function buildDirectoryQueryVariables(
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

function useParentPermissionGates(): Pick<ParentsViewModel, "canParentsCreate" | "canParentManageStatus"> {
  // NEW FOR PLAN v5: read the user's permissions ONCE in the ViewModel and
  // expose boolean gates. Tier parents views no longer import `RequirePermission`
  // or call `useUserStore()` (specs.md §3 N3).
  const hasPermission = useUserStore(state => state.hasPermission);
  const canParentsCreate = hasPermission(AppPermission.ParentsCreate);
  const canParentManageStatus = hasPermission(AppPermission.ParentManageStatus);
  return { canParentsCreate, canParentManageStatus };
}

function useParentsDirectoryQuery() {
  const { searchQuery, page, pageSize, lifecycleStatusFilter } = useParentsStore();
  const variables = buildDirectoryQueryVariables(searchQuery, pageSize, page, lifecycleStatusFilter);
  return useQuery(parentDirectoryQueryDocument, {
    variables,
    fetchPolicy: "cache-and-network",
  });
}

function useParentHandlers(
  rows: readonly ParentDirectoryRow[],
  labelsBySection: ParentsDirectoryLabelsBySection
): Pick<ParentsViewModel, "onAddParent" | "onOpenSettings" | "onSearch" | "onPageChange" | "onFilter" | "onExport"> {
  const router = useRouter();
  const { setSearchQuery, setPage, setFilterPanelOpen, filterPanelOpen } = useParentsStore();

  const onAddParent = () => {
    router.push("/parents/onboarding");
  };

  const onOpenSettings = (id: string) => {
    const row = rows.find(r => r.id === id);
    const href = profileHrefForParent({ userId: row?.userId, parentId: id });
    if (href) {
      router.push(href);
    }
  };

  const onSearch = (query: string) => {
    setSearchQuery(query);
  };

  const onPageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
    },
    [setPage]
  );

  const onFilter = useCallback(() => {
    setFilterPanelOpen(!filterPanelOpen);
  }, [filterPanelOpen, setFilterPanelOpen]);

  const onExport = useCallback(() => {
    const { shell, columns } = labelsBySection;
    const exportLabels: ParentDirectoryExportLabels = {
      pageTitle: shell.pageTitle,
      table: {
        index: columns.index,
        name: columns.name,
        email: columns.email,
        time: columns.time,
        status: columns.status,
        unpaidInvoices: columns.unpaidInvoices,
        statusLabels: columns.statusLabels,
      },
    };
    void exportParentDirectory({ rows, labels: exportLabels });
  }, [rows, labelsBySection]);

  return { onAddParent, onOpenSettings, onSearch, onPageChange, onFilter, onExport };
}

export type UseParentsViewModelProps = Record<string, never>;

export function useParentsViewModel(_props: Readonly<UseParentsViewModelProps>): ParentsViewModel {
  const t = useAppTranslation(Translation.Dashboard.ParentsDirectory);

  const { canParentsCreate, canParentManageStatus } = useParentPermissionGates();

  const { page, pageSize, lifecycleStatusFilter, filterPanelOpen, setLifecycleStatusFilter, resetFilters } =
    useParentsStore();

  const { data, loading } = useParentsDirectoryQuery();
  const directory = data?.parentDirectory;
  const metrics = useDirectoryMetrics(directory ?? null);
  const rows = useDirectoryRows(directory ?? null);
  const labelsBySection = buildLabelsBySection(t);

  const handlers = useParentHandlers(rows, labelsBySection);

  return {
    metrics,
    rows,
    labelsBySection,
    loading,
    page,
    pageSize,
    totalCount: directory ? (directory.totalCount ?? 0) : undefined,
    lifecycleStatusFilter,
    filterPanelOpen,
    onLifecycleStatusFilterChange: setLifecycleStatusFilter,
    onResetFilters: resetFilters,
    ...handlers,
    // NEW FOR PLAN v5: lifted permission booleans consumed by the tier views.
    canParentsCreate,
    canParentManageStatus,
  };
}

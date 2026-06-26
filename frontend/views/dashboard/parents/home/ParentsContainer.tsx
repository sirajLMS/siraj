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
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { parentDirectoryQueryDocument } from "@/frontend/graphql/sharedDocuments/parent-directory.documents";
import { useParentsStore } from "@/frontend/stores/parentsStore";
import { logger } from "@/frontend/utils/logger";
import type { ParentAccountStatus } from "@/frontend/views/dashboard/parents/types/directory";
import { ParentsView } from "./ParentsView";

export function ParentsContainer() {
  const t = useTranslations("dashboard.parentsDirectory");
  const { searchQuery, page, pageSize, setSearchQuery, setPage } = useParentsStore();

  const { data } = useQuery(parentDirectoryQueryDocument, {
    variables: {
      search: searchQuery || null,
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

  const metrics = directory?.metrics
    ? [
        {
          key: "activated",
          count: directory.metrics.activated ?? 0,
          labelKey: "dashboard.parentsDirectory.metrics.activated",
          icon: HowToRegOutlined,
        },
        {
          key: "deactivated",
          count: directory.metrics.deactivated ?? 0,
          labelKey: "dashboard.parentsDirectory.metrics.deactivated",
          icon: CancelOutlined,
        },
        {
          key: "regular",
          count: directory.metrics.regular ?? 0,
          labelKey: "dashboard.parentsDirectory.metrics.regular",
          icon: VerifiedUserOutlined,
        },
        {
          key: "on_leave",
          count: directory.metrics.onLeave ?? 0,
          labelKey: "dashboard.parentsDirectory.metrics.onLeave",
          icon: EventBusyOutlined,
        },
        {
          key: "suspended",
          count: directory.metrics.suspended ?? 0,
          labelKey: "dashboard.parentsDirectory.metrics.suspended",
          icon: BlockOutlined,
        },
        {
          key: "on_trial",
          count: directory.metrics.onTrial ?? 0,
          labelKey: "dashboard.parentsDirectory.metrics.onTrial",
          icon: TimerOutlined,
        },
      ]
    : [];

  const rows = (directory?.rows ?? []).map(row => ({
    id: row.id ?? "",
    index: row.index ?? 0,
    name: row.name ?? "",
    email: row.email ?? "",
    avatarUrl: row.avatarUrl ?? undefined,
    guardianOf: row.guardianOf ?? "",
    time: row.time ?? "",
    accountStatus: (row.accountStatus as ParentAccountStatus) || "regular",
    unpaidInvoices: row.unpaidInvoices ?? 0,
  }));

  const labels = {
    pageTitle: t("pageTitle"),
    pageSubtitle: t("pageSubtitle"),
    addParent: t("actions.addParent"),
    records: t("records"),
    searchPlaceholder: t("searchPlaceholder"),
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
      statusLabels: {
        activated: t("metrics.activated"),
        deactivated: t("metrics.deactivated"),
        regular: t("metrics.regular"),
        on_leave: t("metrics.onLeave"),
        suspended: t("metrics.suspended"),
        on_trial: t("metrics.onTrial"),
      } as Record<ParentAccountStatus, string>,
    },
    card: {
      guardianOf: (name: string) => t("card.guardianOf", { name }),
      unpaidCount: (count: number) => t("card.unpaidCount", { count }),
      invoicesCleared: t("card.invoicesCleared"),
      statusLabels: {
        activated: t("metrics.activated"),
        deactivated: t("metrics.deactivated"),
        regular: t("metrics.regular"),
        on_leave: t("metrics.onLeave"),
        suspended: t("metrics.suspended"),
        on_trial: t("metrics.onTrial"),
      } as Record<ParentAccountStatus, string>,
    },
  };

  const handleAddParent = () => {
    logger.info("Add parent clicked");
  };

  const handleOpenSettings = (id: string) => {
    logger.info("Open settings for parent:", id);
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

  return (
    <RequirePermission permissions={[AppPermission.ParentViewDirectory]}>
      <ParentsView
        metrics={metrics}
        rows={rows}
        labels={labels}
        page={page}
        pageSize={pageSize}
        totalCount={directory?.totalCount ?? 0}
        onAddParent={handleAddParent}
        onOpenSettings={handleOpenSettings}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
      />
    </RequirePermission>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { type ParentAccountStatus, useParentsStore } from "@/frontend/stores/parentsStore";
import { ParentsView } from "./ParentsView";

export function ParentsContainer() {
  const t = useTranslations("dashboard.parentsDirectory");
  const { metrics, rows, setSearchQuery } = useParentsStore();

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

  return (
    <ParentsView
      metrics={metrics}
      rows={rows}
      labels={labels}
      onAddParent={handleAddParent}
      onOpenSettings={handleOpenSettings}
      onSearch={handleSearch}
    />
  );
}

// Add logger import
import { logger } from "@/frontend/utils/logger";

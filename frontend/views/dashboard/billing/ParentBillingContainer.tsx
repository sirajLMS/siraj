"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useParentBillingStore } from "@/frontend/stores/parentBillingStore";
import { useUserStore } from "@/frontend/stores/userStore";
import { logger } from "@/frontend/utils/logger";
import { ParentBillingView } from "./ParentBillingView";
import type { ParentBillingViewProps } from "./types/billingViewTypes";
import { filterParentInvoices } from "./utils/billingFilters";
import { buildBillingLabels } from "./utils/buildBillingLabels";

export function ParentBillingContainer() {
  const t = useTranslations("dashboard.billing");
  const permissions = useUserStore(state => state.permissions);
  const labels = buildBillingLabels(t);

  const canManage = permissions.includes("billing-manage");
  const canView = permissions.includes("billing-view");
  const canCreate = permissions.includes("billing-create");

  const searchQuery = useParentBillingStore(state => state.searchQuery);
  const summary = useParentBillingStore(state => state.summary);
  const invoices = useParentBillingStore(state => state.invoices);
  const setSearchQuery = useParentBillingStore(state => state.setSearchQuery);
  const payNow = useParentBillingStore(state => state.payNow);
  const downloadPdf = useParentBillingStore(state => state.downloadPdf);

  const filteredInvoices = useMemo(() => filterParentInvoices(invoices, searchQuery), [invoices, searchQuery]);

  if (!canView) {
    return null;
  }

  const viewProps: ParentBillingViewProps = {
    labels,
    summary,
    invoices: filteredInvoices,
    searchQuery,
    canManage,
    canView,
    canCreate,
    onSearchChange: setSearchQuery,
    onPayNow: payNow,
    onDownloadPdf: downloadPdf,
    onQuickPay: () => {
      logger.info("Quick pay requested");
    },
  };

  return <ParentBillingView {...viewProps} />;
}

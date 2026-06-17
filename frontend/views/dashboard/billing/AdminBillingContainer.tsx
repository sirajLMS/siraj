"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { useAdminBillingStore } from "@/frontend/stores/mockAdminBillingStore";
import { useUserStore } from "@/frontend/stores/mockUserStore";
import { AdminBillingView } from "./AdminBillingView";
import type { AdminBillingViewProps } from "./types/billingViewTypes";
import { filterAdminInvoices } from "./utils/billingFilters";
import { buildBillingLabels } from "./utils/buildBillingLabels";

export function AdminBillingContainer() {
  const t = useTranslations("dashboard.billing");
  const router = useRouter();
  const locale = useLocale();
  const permissions = useUserStore(state => state.permissions);
  const labels = buildBillingLabels(t);

  const canManage = permissions.includes("billing-manage");
  const canView = permissions.includes("billing-view");
  const canCreate = permissions.includes("billing-create");

  const searchQuery = useAdminBillingStore(state => state.searchQuery);
  const summary = useAdminBillingStore(state => state.summary);
  const invoices = useAdminBillingStore(state => state.invoices);
  const creditRows = useAdminBillingStore(state => state.creditRows);
  const setSearchQuery = useAdminBillingStore(state => state.setSearchQuery);
  const markAsPaid = useAdminBillingStore(state => state.markAsPaid);
  const sendReminder = useAdminBillingStore(state => state.sendReminder);

  const filteredInvoices = useMemo(() => filterAdminInvoices(invoices, searchQuery), [invoices, searchQuery]);

  if (!canManage) {
    return null;
  }

  const viewProps: AdminBillingViewProps = {
    labels,
    summary,
    invoices: filteredInvoices,
    creditRows,
    searchQuery,
    canManage,
    canView,
    canCreate,
    onSearchChange: setSearchQuery,
    onMarkAsPaid: markAsPaid,
    onSendReminder: sendReminder,
    onManualInvoice: () => {
      router.push(`/${locale}/billing/manual`);
    },
  };

  return <AdminBillingView {...viewProps} />;
}

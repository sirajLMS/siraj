"use client";

import { useQuery } from "@apollo/client/react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { parentInvoiceHistoryQueryDocument } from "@/frontend/graphql/sharedDocuments";
import { ParentBillingView } from "./ParentBillingView";
import type { ParentBillingViewProps } from "./types/billingViewTypes";
import { filterParentInvoices } from "./utils/billingFilters";
import { buildBillingLabels } from "./utils/buildBillingLabels";

export function ParentBillingContainer() {
  const t = useTranslations("dashboard.billing");
  const params = useParams();
  const parentId = typeof params?.id === "string" ? params.id : "";
  const labels = buildBillingLabels(t);

  const [searchQuery, setSearchQuery] = useState("");

  const { data, loading, error } = useQuery(parentInvoiceHistoryQueryDocument, {
    variables: { parentId },
    skip: !parentId,
  });

  const invoices = useMemo(() => data?.parentInvoiceHistory ?? [], [data?.parentInvoiceHistory]);

  const filteredInvoices = useMemo(
    () =>
      filterParentInvoices(
        invoices.map(inv => ({
          id: inv.id ?? "",
          invoiceNumber: (inv.id ?? "").slice(0, 8).toUpperCase(),
          month: inv.issueDate ? new Date(inv.issueDate).toLocaleString("en", { month: "long" }) : "",
          issueDate: inv.issueDate ?? "",
          dueDate: inv.dueDate ?? "",
          paidDate: inv.paidDate ?? "—",
          fee: `${inv.currency} ${inv.amount}`,
          status: (inv.status?.toLowerCase() ?? "unpaid") as "paid" | "unpaid",
        })),
        searchQuery
      ),
    [invoices, searchQuery]
  );

  if (!parentId) {
    return <Typography sx={{ color: theme => theme.palette.error.main }}>{t("errors.invalidId")}</Typography>;
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Typography sx={{ color: theme => theme.palette.error.main }}>{error.message}</Typography>;
  }

  const viewProps: ParentBillingViewProps = {
    labels,
    summary: {
      outstandingBalance: "",
      paidThisTerm: "",
      nextDueDate: "",
      activeStudents: "",
    },
    invoices: filteredInvoices,
    searchQuery,
    canManage: false,
    canView: true,
    canCreate: false,
    onSearchChange: setSearchQuery,
    onPayNow: () => undefined,
    onDownloadPdf: () => undefined,
    onQuickPay: () => undefined,
  };

  return (
    <RequirePermission permissions={[AppPermission.BillingViewHistory]}>
      <ParentBillingView {...viewProps} />
    </RequirePermission>
  );
}

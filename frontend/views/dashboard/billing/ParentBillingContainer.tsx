"use client";

import { useQuery } from "@apollo/client/react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { parentInvoiceHistoryQueryDocument } from "@/frontend/graphql/sharedDocuments";
import { useParentBillingStore } from "@/frontend/stores/parentBillingStore";
import { ParentBillingView } from "./ParentBillingView";
import type { ParentBillingViewProps } from "./types/billingViewTypes";
import { filterParentInvoices } from "./utils/billingFilters";
import { buildBillingLabels } from "./utils/buildBillingLabels";

// Typography styled with error color for displaying error messages
const StyledErrorTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
}));

export function ParentBillingContainer() {
  const t = useTranslations("dashboard.billing");
  const params = useParams();
  const parentId = typeof params?.id === "string" ? params.id : "";
  const labels = buildBillingLabels(t);

  const [searchQuery, setSearchQuery] = useState("");

  const page = useParentBillingStore(state => state.page);
  const pageSize = useParentBillingStore(state => state.pageSize);
  const setPage = useParentBillingStore(state => state.setPage);

  const { data, loading, error } = useQuery(parentInvoiceHistoryQueryDocument, {
    variables: {
      parentId,
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
    skip: !parentId,
    fetchPolicy: "cache-and-network",
  });

  const totalCount = data?.parentInvoiceHistory?.totalCount ?? 0;

  const invoices = useMemo(() => data?.parentInvoiceHistory?.rows ?? [], [data?.parentInvoiceHistory]);

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
    return <StyledErrorTypography>{t("errors.invalidId")}</StyledErrorTypography>;
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <StyledErrorTypography>{error.message}</StyledErrorTypography>;
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
    page,
    pageSize,
    totalCount,
    onPageChange: setPage,
  };

  return (
    <RequirePermission permissions={[AppPermission.BillingViewHistory]}>
      <ParentBillingView {...viewProps} />
    </RequirePermission>
  );
}

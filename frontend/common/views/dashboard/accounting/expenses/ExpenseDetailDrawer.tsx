"use client";

import { useQuery } from "@apollo/client/react";
import { Box, Drawer, useTheme } from "@mui/material";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { expenseQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { EXPENSE_DETAIL_PAPER_SX } from "@/frontend/common/views/dashboard/accounting/expenses/ExpenseDetailDrawer.helpers";
import {
  DeletedBanner,
  DrawerBody,
  DrawerHeader,
} from "@/frontend/common/views/dashboard/accounting/expenses/ExpenseDetailDrawer.parts";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingExpenses, Translation } from "@/shared/locale/namespaces";

export interface ExpenseDetailDrawerProps {
  /** Expense id to drill into; the detail query only runs while open. */
  readonly expenseId: string;
  /** Whether the drawer is visible. */
  readonly open: boolean;
  /** Close request raised by the close button, Escape, or backdrop click. */
  readonly onClose: () => void;
}

/**
 * Right-side drill-down for a single expense: the full record fields, its type
 * badge, and the provenance source badge. The carryover-sourced badge deep-links
 * into the matching carryover balance route; soft-deleted records get a
 * warning banner with the deletion reason. The detail query runs only while
 * the drawer is open.
 */
export function ExpenseDetailDrawer({ expenseId, open, onClose }: Readonly<ExpenseDetailDrawerProps>) {
  const theme = useTheme();
  const router = useRouter();
  const labels = useAppTranslation(DashboardAccountingExpenses);
  const commonLabels = useAppTranslation(Translation.Common);
  const { data, loading, error } = useQuery(expenseQueryDocument, {
    variables: { id: expenseId },
    fetchPolicy: "cache-and-network",
    skip: !open,
  });
  const expense = data?.expense ?? null;
  // Until the detail resolves there is no title to interpolate, so fall back to
  // the generic page title instead of the template's trailing empty slot.
  const expenseTitle = expense?.title ?? "";
  const title = expenseTitle === "" ? labels.title : labels.drawer.title(expenseTitle);
  const handleViewSource = useCallback(
    (sourceEntityId: string) => {
      router.push(`/accounting/carryover/${sourceEntityId}`);
    },
    [router]
  );

  return (
    <Drawer
      anchor={theme.direction === "rtl" ? "left" : "right"}
      open={open}
      onClose={onClose}
      aria-label={title}
      slotProps={{ paper: { sx: EXPENSE_DETAIL_PAPER_SX } }}
    >
      <DrawerHeader
        expense={expense}
        title={title}
        labels={labels}
        closeLabel={commonLabels.ariaClose}
        onClose={onClose}
      />
      <Box sx={{ flex: 1, overflowY: "auto", px: 2.5, py: 3 }}>
        {expense !== null && expense.deletedAt !== null ? (
          <DeletedBanner expense={expense} labels={labels} commonLabels={commonLabels} />
        ) : null}
        <DrawerBody
          expense={expense}
          loading={loading}
          hasError={Boolean(error)}
          labels={labels}
          commonLabels={commonLabels}
          onViewSource={handleViewSource}
        />
      </Box>
    </Drawer>
  );
}

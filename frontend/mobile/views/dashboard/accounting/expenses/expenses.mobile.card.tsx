"use client";

import { LinkOutlined } from "@mui/icons-material";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { StatusBadge } from "@/frontend/common/components/ui";
import { ExpenseType } from "@/frontend/common/graphql/generated/gql/graphql";
import { formatAccountingMoney } from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import type { ExpenseRow } from "@/frontend/common/views/dashboard/accounting/expenses/useExpensesViewModel";
import { MobileCardListItem } from "@/frontend/mobile/components/ui";
import {
  ExpenseRowMenu,
  type ExpenseRowMenuProps,
} from "@/frontend/mobile/views/dashboard/accounting/expenses/expenses.mobile.rowMenu";
import { EXPENSE_SOURCE_CARRYOVER_BALANCES } from "@/shared/constants/expenses";
import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";

/** Native-button reset for the tappable card body that opens the detail drawer. */
const CARD_TAP_TARGET_SX = (theme: Theme) => ({
  flex: 1,
  minWidth: 0,
  padding: 0,
  border: "none",
  background: "none",
  cursor: "pointer",
  textAlign: "start",
  color: "inherit",
  font: "inherit",
  borderRadius: 1,
  "&:focus-visible": {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2,
  },
});

/** Localized label for an expense type, so badge cells carry the full copy. */
function expenseTypeLabel(labels: ExpensesLabels, type: ExpenseType): string {
  const labelsByType: Record<ExpenseType, string> = {
    [ExpenseType.Salaries]: labels.type.Salaries,
    [ExpenseType.Marketing]: labels.type.Marketing,
    [ExpenseType.Logistics]: labels.type.Logistics,
    [ExpenseType.Technology]: labels.type.Technology,
  };
  return labelsByType[type];
}

/** Provenance badge row: Manual for hand-entered rows, From Carryover for settlement rows. */
function expenseSourceBadges(row: ExpenseRow, labels: ExpensesLabels): ReactNode {
  if (row.sourceEntity === EXPENSE_SOURCE_CARRYOVER_BALANCES && row.sourceEntityId !== null) {
    return (
      <StatusBadge
        category="expenseSource"
        status="carryover"
        label={labels.source.FromCarryover}
        icon={<LinkOutlined fontSize="small" />}
      />
    );
  }
  if (row.sourceEntity !== null) return null;
  return <StatusBadge category="expenseSource" status="manual" label={labels.source.Manual} />;
}

interface ExpenseCardProps extends Omit<ExpenseRowMenuProps, "menuAriaLabel"> {
  readonly menuAriaLabel: string;
  readonly onOpenDrawer: (row: ExpenseRow) => void;
}

/**
 * One expense row as a mobile card: tappable body (opens the detail drawer)
 * with title + amount, the type/source badge row with the deleted badge, the
 * teacher line when set, and a per-card overflow menu holding the row actions.
 * Soft-deleted rows render dimmed with a struck-through title.
 */
export function ExpenseCard({
  row,
  labels,
  menuAriaLabel,
  canManage,
  onOpenDrawer,
  ...callbacks
}: Readonly<ExpenseCardProps>) {
  const deleted = row.deletedAt !== null;
  const title = row.title ?? "";
  return (
    <MobileCardListItem variant="rounded" dimmed={deleted}>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
        <ButtonBase
          type="button"
          onClick={() => onOpenDrawer(row)}
          aria-label={labels.drawer.title(title)}
          sx={CARD_TAP_TARGET_SX}
        >
          <Stack sx={{ gap: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 1 }}>
              <Typography
                variant="titleLg"
                sx={{ minWidth: 0, ...(deleted ? { textDecoration: "line-through" } : null) }}
              >
                {title}
              </Typography>
              <Typography variant="titleLg" sx={{ flexShrink: 0 }}>
                {formatAccountingMoney(row.expenseValue)} {row.expenseCurrency ?? ""}
              </Typography>
            </Box>
            <Stack direction="row" sx={{ alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              {row.type !== null ? (
                <StatusBadge category="expenseType" status={row.type} label={expenseTypeLabel(labels, row.type)} />
              ) : null}
              {expenseSourceBadges(row, labels)}
              {deleted ? <StatusBadge category="session" status="cancelled" label={labels.deletedBadge} /> : null}
            </Stack>
            {row.teacherName !== null && row.teacherName !== "" ? (
              <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                {row.teacherName}
              </Typography>
            ) : null}
          </Stack>
        </ButtonBase>
        <ExpenseRowMenu row={row} labels={labels} menuAriaLabel={menuAriaLabel} canManage={canManage} {...callbacks} />
      </Box>
    </MobileCardListItem>
  );
}

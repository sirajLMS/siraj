"use client";

import LinkOutlined from "@mui/icons-material/LinkOutlined";
import { Box, Stack, Tooltip } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { StatusBadge } from "@/frontend/common/components/ui";
import { PersonProfileLinkCell } from "@/frontend/common/components/ui/display/personProfileLink/PersonProfileLinkCell";
import { profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import { formatAccountingMoney } from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import {
  ELLIPSIZED_TEXT_SX,
  EXPENSES_EMPTY_VALUE_SX,
} from "@/frontend/common/views/dashboard/accounting/expenses/ExpensesDataGrid.helpers";
import type { ExpenseRow } from "@/frontend/common/views/dashboard/accounting/expenses/useExpensesViewModel";
import { EXPENSE_SOURCE_CARRYOVER_BALANCES } from "@/shared/constants/expenses";
import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";

/**
 * Title cell: the expense name with a hover tooltip, ellipsized when narrow.
 * Soft-deleted rows (surfaced when the include-deleted filter is on) render
 * struck-through in the muted tone with a "Deleted" badge alongside.
 */
export function ExpenseTitleCell({ row, labels }: Readonly<{ row: ExpenseRow; labels: ExpensesLabels }>) {
  const title = row.title ?? "";
  const deleted = row.deletedAt !== null;
  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 1, minWidth: 0, width: "100%" }}>
      <Tooltip title={title}>
        <Box
          component="span"
          sx={(theme: Theme) => ({
            ...ELLIPSIZED_TEXT_SX,
            ...(deleted ? { textDecoration: "line-through", color: theme.palette.text.disabled } : null),
          })}
        >
          {title}
        </Box>
      </Tooltip>
      {deleted ? (
        <Box sx={{ flexShrink: 0 }}>
          <StatusBadge category="session" status="cancelled" label={labels.deletedBadge} />
        </Box>
      ) : null}
    </Stack>
  );
}

/**
 * Teacher cell: profile-linked name for teacher-bound expenses, a muted dash
 * for manual rows without a teacher. The name is a creation-time snapshot, so
 * the row stays correct after a teacher rename or deactivation.
 */
export function ExpenseTeacherCell({ row }: Readonly<{ row: ExpenseRow }>) {
  const name = row.teacherName ?? "";
  if (row.teacherId === null || name === "") {
    return (
      <Box component="span" sx={EXPENSES_EMPTY_VALUE_SX}>
        —
      </Box>
    );
  }
  return (
    <Tooltip title={name}>
      <Box
        sx={{
          minWidth: 0,
          width: "100%",
          "& .MuiStack-root": { minWidth: 0 },
          "& .MuiTypography-root": ELLIPSIZED_TEXT_SX,
        }}
      >
        <PersonProfileLinkCell href={profileHrefForTeacher({ teacherId: row.teacherId })} name={name} />
      </Box>
    </Tooltip>
  );
}

/** Money cell: grouped amount with the expense currency beside it, both theme-toned. */
export function ExpenseMoneyCell({ amount, currency }: Readonly<{ amount: string | null; currency: string | null }>) {
  const isEmpty = amount === null;
  return (
    <Stack direction="row" sx={{ alignItems: "baseline", gap: 0.5 }}>
      <Box component="span" sx={isEmpty ? EXPENSES_EMPTY_VALUE_SX : { fontWeight: 600 }}>
        {formatAccountingMoney(amount)}
      </Box>
      {currency !== null ? (
        <Box component="span" sx={(theme: Theme) => ({ color: theme.palette.onSurfaceVariant })}>
          {currency}
        </Box>
      ) : null}
    </Stack>
  );
}

/**
 * Plain text cell where the absent-value placeholder renders muted so an
 * em-dash never reads as real data beside populated cells.
 */
export function ExpenseValueCell({ text, empty }: Readonly<{ text: string; empty: boolean }>) {
  if (empty) {
    return (
      <Box component="span" sx={EXPENSES_EMPTY_VALUE_SX}>
        —
      </Box>
    );
  }
  return <Box component="span">{text}</Box>;
}

/** One-line note excerpt; the full note stays readable on hover. */
export function ExpenseNoteCell({ value }: Readonly<{ value: string | null }>) {
  if (value === null || value.trim() === "") {
    return (
      <Box component="span" sx={EXPENSES_EMPTY_VALUE_SX}>
        —
      </Box>
    );
  }
  return (
    <Tooltip title={value}>
      <Box component="span" sx={ELLIPSIZED_TEXT_SX}>
        {value}
      </Box>
    </Tooltip>
  );
}

/**
 * Provenance cell: a neutral "Manual" badge for hand-entered rows, a "From
 * Carryover" badge for settlement-produced rows, and nothing for a carryover
 * marker without a resolvable linked id (unreachable per the server
 * invariant). The deep link stays available through the row actions menu.
 */
export function ExpenseSourceBadgeCell({
  sourceEntity,
  sourceEntityId,
  labels,
}: Readonly<{ sourceEntity: string | null; sourceEntityId: string | null; labels: ExpensesLabels }>) {
  if (sourceEntity === EXPENSE_SOURCE_CARRYOVER_BALANCES && sourceEntityId !== null) {
    return (
      <StatusBadge
        category="expenseSource"
        status="carryover"
        label={labels.source.FromCarryover}
        icon={<LinkOutlined fontSize="small" />}
      />
    );
  }
  if (sourceEntity !== null) return null;
  return <StatusBadge category="expenseSource" status="manual" label={labels.source.Manual} />;
}

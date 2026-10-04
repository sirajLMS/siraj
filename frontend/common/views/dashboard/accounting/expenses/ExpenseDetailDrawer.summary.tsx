"use client";

import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import { Box, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { StatusBadge } from "@/frontend/common/components/ui";
import { LabeledField } from "@/frontend/common/components/ui/display/labeledField/LabeledField";
import { PersonProfileLink } from "@/frontend/common/components/ui/display/personProfileLink/PersonProfileLink";
import { formatLockedAmount } from "@/frontend/common/lib/currency";
import { profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import {
  EXPENSE_DETAIL_FULL_WIDTH_SX,
  EXPENSE_DETAIL_SUMMARY_GRID_SX,
  type ExpenseDetail,
  formatOptionalDate,
} from "@/frontend/common/views/dashboard/accounting/expenses/ExpenseDetailDrawer.helpers";
import { EXPENSE_SOURCE_CARRYOVER_BALANCES } from "@/shared/constants/expenses";
import { useAppLocale } from "@/shared/locale";
import type { CommonLabels } from "@/shared/locale/types/common";
import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";

function ExpenseValue({ expense, notSet }: { readonly expense: ExpenseDetail; readonly notSet: string }) {
  const locale = useAppLocale();
  if (expense.expenseValue === null || expense.expenseCurrency === null) {
    return <>{notSet}</>;
  }
  return (
    <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
      {formatLockedAmount(expense.expenseValue, expense.expenseCurrency, locale)}
    </Typography>
  );
}

/**
 * Provenance field for the summary grid: a neutral "Manual" badge for
 * hand-entered rows, and a clickable "From Carryover" badge for rows produced
 * by the carryover settlement flow — activating it hands the linked balance id
 * to `onViewSource` so the caller opens the carryover detail drawer. A
 * carryover marker without a resolvable linked id (unreachable per the server
 * invariant) renders nothing rather than a mislabeled Manual badge.
 */
function ExpenseSourceBadge({
  expense,
  labels,
  onViewSource,
}: {
  readonly expense: ExpenseDetail;
  readonly labels: ExpensesLabels;
  readonly onViewSource: (sourceEntityId: string) => void;
}) {
  if (expense.sourceEntity === EXPENSE_SOURCE_CARRYOVER_BALANCES && expense.sourceEntityId !== null) {
    const sourceId = expense.sourceEntityId;
    const label = labels.source.FromCarryover;
    return (
      <Box
        sx={(theme: Theme) => ({
          display: "inline-block",
          "& > button": {
            display: "block",
            padding: 0,
            border: "none",
            background: "none",
            cursor: "pointer",
            borderRadius: theme.shape.borderRadius,
          },
          "& > button:focus-visible": {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
        })}
      >
        <button type="button" aria-label={label} onClick={() => onViewSource(sourceId)}>
          <StatusBadge category="expenseSource" status="carryover" label={label} icon={<LinkOutlinedIcon />} />
        </button>
      </Box>
    );
  }
  if (expense.sourceEntity !== null) return null;
  return <StatusBadge category="expenseSource" status="manual" label={labels.source.Manual} />;
}

export function ExpenseSummary({
  expense,
  labels,
  commonLabels,
  onViewSource,
}: {
  readonly expense: ExpenseDetail;
  readonly labels: ExpensesLabels;
  readonly commonLabels: CommonLabels;
  readonly onViewSource: (sourceEntityId: string) => void;
}) {
  const locale = useAppLocale();
  const notSet = commonLabels.notSet;
  return (
    <Box sx={EXPENSE_DETAIL_SUMMARY_GRID_SX}>
      <LabeledField label={labels.column.value} value={<ExpenseValue expense={expense} notSet={notSet} />} />
      <LabeledField label={labels.modal.form.currency} value={expense.expenseCurrency ?? notSet} />
      <LabeledField
        label={labels.column.teacher}
        value={
          expense.teacherName === null ? (
            notSet
          ) : (
            <PersonProfileLink
              name={expense.teacherName}
              href={profileHrefForTeacher({ teacherId: expense.teacherId })}
            />
          )
        }
      />
      <LabeledField label={labels.column.paymentDate} value={expense.paymentDate ?? notSet} />
      <LabeledField label={labels.column.expenseDate} value={expense.expenseDate ?? notSet} />
      <LabeledField
        label={labels.column.source}
        value={<ExpenseSourceBadge expense={expense} labels={labels} onViewSource={onViewSource} />}
      />
      <LabeledField label={labels.drawer.createdBy} value={expense.createdByName ?? notSet} />
      <LabeledField label={labels.column.createdAt} value={formatOptionalDate(expense.createdAt, locale, notSet)} />
      <LabeledField label={labels.drawer.updatedAt} value={formatOptionalDate(expense.updatedAt, locale, notSet)} />
      <Box sx={EXPENSE_DETAIL_FULL_WIDTH_SX}>
        <LabeledField label={labels.column.note} value={expense.note ?? notSet} />
      </Box>
    </Box>
  );
}

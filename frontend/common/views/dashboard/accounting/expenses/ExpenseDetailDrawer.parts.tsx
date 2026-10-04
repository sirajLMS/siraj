"use client";

import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { Alert, AlertTitle, Box, IconButton, Stack, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui";
import { DetailDrawerState } from "@/frontend/common/views/dashboard/accounting/__shared__";
import {
  EXPENSE_DETAIL_HEADER_SX,
  type ExpenseDetail,
  expenseTypeLabel,
  formatOptionalDate,
} from "@/frontend/common/views/dashboard/accounting/expenses/ExpenseDetailDrawer.helpers";
import { ExpenseSummary } from "@/frontend/common/views/dashboard/accounting/expenses/ExpenseDetailDrawer.summary";
import { useAppLocale } from "@/shared/locale";
import type { CommonLabels } from "@/shared/locale/types/common";
import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";

export function DrawerHeader({
  expense,
  title,
  labels,
  closeLabel,
  onClose,
}: {
  readonly expense: ExpenseDetail | null;
  readonly title: string;
  readonly labels: ExpensesLabels;
  readonly closeLabel: string;
  readonly onClose: () => void;
}) {
  return (
    <Box sx={EXPENSE_DETAIL_HEADER_SX}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {expense?.type ? (
          <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
            <StatusBadge category="expenseType" status={expense.type} label={expenseTypeLabel(labels, expense.type)} />
          </Stack>
        ) : null}
      </Box>
      <IconButton aria-label={closeLabel} onClick={onClose} size="small">
        <CloseOutlinedIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

/** Warning banner pinned above the summary when the record was soft-deleted. */
export function DeletedBanner({
  expense,
  labels,
  commonLabels,
}: {
  readonly expense: ExpenseDetail;
  readonly labels: ExpensesLabels;
  readonly commonLabels: CommonLabels;
}) {
  const locale = useAppLocale();
  return (
    <Alert severity="warning" sx={{ mb: 3 }}>
      <AlertTitle>{labels.drawer.deletedBanner}</AlertTitle>
      <Stack spacing={0.5}>
        <Typography variant="bodyMd">
          {`${labels.drawer.deletedAt}: ${formatOptionalDate(expense.deletedAt, locale, commonLabels.notSet)}`}
        </Typography>
        {expense.deletedReason ? (
          <Typography variant="bodyMd">{`${labels.drawer.deletionReason}: ${expense.deletedReason}`}</Typography>
        ) : null}
      </Stack>
    </Alert>
  );
}

export function DrawerBody({
  expense,
  loading,
  hasError,
  labels,
  commonLabels,
  onViewSource,
}: {
  readonly expense: ExpenseDetail | null;
  readonly loading: boolean;
  readonly hasError: boolean;
  readonly labels: ExpensesLabels;
  readonly commonLabels: CommonLabels;
  readonly onViewSource: (sourceEntityId: string) => void;
}) {
  return (
    <DetailDrawerState
      loading={loading}
      hasError={hasError}
      hasData={expense !== null}
      loadError={labels.loadError}
      loadingLabel={commonLabels.loading}
    >
      {expense ? (
        <ExpenseSummary expense={expense} labels={labels} commonLabels={commonLabels} onViewSource={onViewSource} />
      ) : null}
    </DetailDrawerState>
  );
}

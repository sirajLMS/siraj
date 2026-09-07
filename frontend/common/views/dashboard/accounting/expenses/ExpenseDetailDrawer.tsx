"use client";

import { useQuery } from "@apollo/client/react";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import {
  Alert,
  AlertTitle,
  Box,
  CircularProgress,
  Drawer,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { formatDate } from "@/frontend/common/components/intl/dateFormat";
import type { ExpenseQuery_expense } from "@/frontend/common/graphql/generated/gql/graphql";
import { expenseQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { formatLockedAmount } from "@/frontend/common/lib/currency";
import { ExpenseSourceChip } from "@/frontend/common/views/dashboard/accounting/expenses/ExpenseSourceChip";
import { ExpenseTypeChip } from "@/frontend/common/views/dashboard/accounting/expenses/ExpenseTypeChip";
import { useAppLocale } from "@/shared/locale";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingExpenses, Translation } from "@/shared/locale/namespaces";
import type { CommonLabels } from "@/shared/locale/types/common";
import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";

type ExpenseDetail = ExpenseQuery_expense;

const PAPER_SX = { width: { xs: "100%", sm: 460 }, maxWidth: "100%" } as const;

const SUMMARY_GRID_SX = {
  display: "grid",
  gap: 2.5,
  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
} as const;

const FULL_WIDTH_SX = { gridColumn: "1 / -1" } as const;

const fieldLabelSx = (theme: Theme) => ({ color: theme.palette.onSurfaceVariant });

const HEADER_SX = (theme: Theme) => ({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 1,
  px: 2.5,
  py: 2,
  borderBottom: `1px solid ${theme.palette.divider}`,
});

export interface ExpenseDetailDrawerProps {
  /** Expense id to drill into; the detail query only runs while open. */
  readonly expenseId: string;
  /** Whether the drawer is visible. */
  readonly open: boolean;
  /** Close request raised by the close button, Escape, or backdrop click. */
  readonly onClose: () => void;
}

interface DetailFieldProps {
  readonly label: string;
  readonly fullWidth?: boolean;
  readonly children: React.ReactNode;
}

/** One labeled field cell in the summary grid: uppercase caption above its value. */
function DetailField({ label, fullWidth, children }: Readonly<DetailFieldProps>) {
  return (
    <Box sx={fullWidth ? FULL_WIDTH_SX : undefined}>
      <Typography variant="labelUppercase" sx={fieldLabelSx}>
        {label}
      </Typography>
      <Box sx={{ typography: "bodyMd", mt: 0.5 }}>{children}</Box>
    </Box>
  );
}

function DrawerHeader({
  expense,
  title,
  closeLabel,
  onClose,
}: {
  readonly expense: ExpenseDetail | null;
  readonly title: string;
  readonly closeLabel: string;
  readonly onClose: () => void;
}) {
  return (
    <Box sx={HEADER_SX}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {expense?.type ? (
          <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
            <ExpenseTypeChip type={expense.type} />
          </Stack>
        ) : null}
      </Box>
      <IconButton aria-label={closeLabel} onClick={onClose} size="small">
        <CloseOutlinedIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

/** Null-safe wrapper: renders the not-set label when the record lacks the timestamp. */
function formatOptionalDate(value: string | null, locale: string, notSet: string): string {
  return value === null ? notSet : formatDate(value, locale, notSet);
}

/** Warning banner pinned above the summary when the record was soft-deleted. */
function DeletedBanner({
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

function ExpenseSummary({
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
    <Box sx={SUMMARY_GRID_SX}>
      <DetailField label={labels.column.value}>
        <ExpenseValue expense={expense} notSet={notSet} />
      </DetailField>
      <DetailField label={labels.modal.form.currency}>{expense.expenseCurrency ?? notSet}</DetailField>
      <DetailField label={labels.column.teacher}>{expense.teacherName ?? notSet}</DetailField>
      <DetailField label={labels.column.paymentDate}>{expense.paymentDate ?? notSet}</DetailField>
      <DetailField label={labels.column.expenseDate}>{expense.expenseDate ?? notSet}</DetailField>
      <DetailField label={labels.column.source}>
        <ExpenseSourceChip
          sourceEntity={expense.sourceEntity}
          sourceEntityId={expense.sourceEntityId}
          onViewSource={onViewSource}
        />
      </DetailField>
      <DetailField label={labels.drawer.createdBy}>{expense.createdByName ?? notSet}</DetailField>
      <DetailField label={labels.column.createdAt}>{formatOptionalDate(expense.createdAt, locale, notSet)}</DetailField>
      <DetailField label={labels.drawer.updatedAt}>{formatOptionalDate(expense.updatedAt, locale, notSet)}</DetailField>
      <DetailField label={labels.column.note} fullWidth>
        {expense.note ?? notSet}
      </DetailField>
    </Box>
  );
}

function DrawerBody({
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
  if (loading && !expense) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }} aria-label={commonLabels.loading}>
        <CircularProgress size={32} />
      </Box>
    );
  }
  if (hasError) {
    return <Alert severity="error">{labels.loadError}</Alert>;
  }
  if (!expense) {
    return null;
  }
  return <ExpenseSummary expense={expense} labels={labels} commonLabels={commonLabels} onViewSource={onViewSource} />;
}

/**
 * Right-side drill-down for a single expense: the full record fields, its type
 * chip, and the provenance source chip. The carryover-sourced chip deep-links
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
      slotProps={{ paper: { sx: PAPER_SX } }}
    >
      <DrawerHeader expense={expense} title={title} closeLabel={commonLabels.ariaClose} onClose={onClose} />
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

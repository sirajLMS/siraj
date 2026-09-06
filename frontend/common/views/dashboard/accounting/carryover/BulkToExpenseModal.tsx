"use client";

import { CombinedGraphQLErrors } from "@apollo/client";
import { useApolloClient, useMutation } from "@apollo/client/react";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
} from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { formatDateInput } from "@/frontend/common/components/intl/dateFormat";
import { DialogPresets } from "@/frontend/common/components/ui/dialog/dialogPresets";
import { AppDatePicker } from "@/frontend/common/components/ui/form/date";
import type {
  BulkToExpenseInput,
  CarryoverBalancesQuery_carryoverBalances_rows,
  CurrencyCode,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { bulkCarryoverToExpenseMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { CARRYOVER_NOTE_MAX_LENGTH } from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverFormViewModel";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingCarryover, Translation } from "@/shared/locale/namespaces";

/** HTML id of the dialog form so the submit button in DialogActions can target it. */
const FORM_ID = "carryover-bulk-to-expense-form";

/** Root field holding the carryover list page; dropped from the cache after a successful conversion. */
const CARRYOVER_LIST_FIELD = "carryoverBalances";

/** Terminal domain rejection surfaced as a non-dismissible in-dialog banner. */
const ALREADY_PAID_ERROR_CODE = "CARRYOVER_ALREADY_PAID";

/** Display + wire format for the expense month field (year-month only). */
const EXPENSE_MONTH_FORMAT = "yyyy-MM";

const DATE_PAIR_SX = {
  display: "grid",
  gap: 2,
  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
} as const;

export type BulkToExpenseRow = Pick<
  CarryoverBalancesQuery_carryoverBalances_rows,
  "id" | "payable" | "teacherCurrency"
>;

export interface BulkToExpenseModalProps {
  /** Whether the dialog is visible; every open starts a fresh session. */
  readonly open: boolean;
  /** Ids of the carryovers selected for conversion. */
  readonly carryoverIds: readonly string[];
  /** Row snapshots for the selected carryovers, used to compute the total and currency summary. */
  readonly rows: readonly BulkToExpenseRow[];
  /** Close request raised by Cancel, Escape, backdrop click, or a successful conversion. */
  readonly onClose: () => void;
  /** Runs after a successful conversion so the host page can refresh its queries. */
  readonly onDone?: () => void;
}

/** A picker can hand over an invalid Date (unparseable keystrokes); those read as "missing". */
function isValidDate(value: Date | null): value is Date {
  return value !== null && !Number.isNaN(value.getTime());
}

interface BulkSelectionSummary {
  readonly count: number;
  readonly totalAmount: string;
  readonly currency: CurrencyCode | null;
}

/**
 * Count, total, and currency line for the selection. The currency follows the
 * list aggregate convention (most rows win, ties go to the earliest-seen
 * currency) and the total sums every selected payable under the v1
 * single-dominant-currency assumption, formatted in the active locale.
 */
function summarizeSelection(
  carryoverIds: readonly string[],
  rows: readonly BulkToExpenseRow[],
  locale: string
): BulkSelectionSummary {
  const selectedIds = new Set(carryoverIds);
  const counts = new Map<CurrencyCode, number>();
  let total = 0;
  for (const row of rows) {
    if (row.id === null || !selectedIds.has(row.id)) continue;
    const payable = Number(row.payable);
    if (!Number.isNaN(payable)) total += payable;
    if (row.teacherCurrency !== null) {
      counts.set(row.teacherCurrency, (counts.get(row.teacherCurrency) ?? 0) + 1);
    }
  }
  let currency: CurrencyCode | null = null;
  let leadingCount = 0;
  for (const [code, count] of counts) {
    if (count > leadingCount) {
      currency = code;
      leadingCount = count;
    }
  }
  const totalAmount = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(total);
  return { count: carryoverIds.length, totalAmount, currency };
}

function getGraphQLErrorCode(error: unknown): string | undefined {
  if (!CombinedGraphQLErrors.is(error)) return undefined;
  const code: unknown = error.errors[0]?.extensions?.code;
  return typeof code === "string" ? code : undefined;
}

/** Service-level domain errors arrive already localized; surface them directly when present. */
function getGraphQLErrorMessage(error: unknown): string | null {
  if (CombinedGraphQLErrors.is(error)) return error.errors[0]?.message ?? null;
  if (error instanceof Error && error.message !== "") return error.message;
  return null;
}

/** Omitted (null) when blank so an untouched note never reaches the wire. */
function toOptionalNote(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed === "" ? null : trimmed;
}

export function BulkToExpenseModal({ open, carryoverIds, rows, onClose, onDone }: Readonly<BulkToExpenseModalProps>) {
  const labels = useAppTranslation(DashboardAccountingCarryover);
  const commonLabels = useAppTranslation(Translation.Common);
  const notifications = useNotifications();
  const client = useApolloClient();
  const locale = useAppLocale();

  const [paymentDate, setPaymentDate] = useState<Date | null>(null);
  const [expenseMonth, setExpenseMonth] = useState<Date | null>(null);
  const [note, setNote] = useState("");
  const [alreadyPaidRejected, setAlreadyPaidRejected] = useState(false);

  // One idempotency token per dialog session: re-opening the dialog starts a
  // fresh conversion, while retries inside the same session reuse the token so
  // the server-side idempotency window absorbs double submissions.
  const clientRequestIdRef = useRef<string | null>(null);
  const submittedTokenRef = useRef<string | null>(null);

  const [bulkToExpense, { loading: submitting }] = useMutation(bulkCarryoverToExpenseMutationDocument, {
    // Domain errors reject with CombinedGraphQLErrors carrying extensions.code.
    errorPolicy: "none",
  });

  // A new open session drops the previous session's fields and rejection
  // banner during render (render-phase state adjustment) so no cascading
  // effect fires.
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setPaymentDate(null);
      setExpenseMonth(null);
      setNote("");
      setAlreadyPaidRejected(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    clientRequestIdRef.current = crypto.randomUUID();
    submittedTokenRef.current = null;
  }, [open]);

  const summary = summarizeSelection(carryoverIds, rows, locale);
  const canSubmit =
    isValidDate(paymentDate) && isValidDate(expenseMonth) && carryoverIds.length > 0 && !alreadyPaidRejected;

  const handlePaymentDateChange = (value: Date | null) => {
    setPaymentDate(value);
    // The expense month almost always matches the payment month, so a freshly
    // picked payment date pre-seeds the still-empty month picker.
    if (isValidDate(value)) {
      setExpenseMonth(current => current ?? value);
    }
  };

  const applySubmitSuccess = () => {
    // The list query carries aggregates (totals depend on every row), so the
    // whole root field is dropped rather than patching rows in place.
    client.cache.evict({ fieldName: CARRYOVER_LIST_FIELD });
    client.cache.gc();
    notifications.show(labels.success.bulkedToExpense(carryoverIds.length), { severity: "success" });
    onDone?.();
    onClose();
  };

  const applySubmitError = (error: unknown) => {
    if (getGraphQLErrorCode(error) === ALREADY_PAID_ERROR_CODE) {
      // Non-dismissible in-dialog banner: the operator must close the dialog
      // and fix the selection (e.g. unpay first) rather than retry as-is.
      setAlreadyPaidRejected(true);
      return;
    }
    notifications.show(getGraphQLErrorMessage(error) ?? commonLabels.operationFailed, { severity: "error" });
  };

  const handleSubmit = async (): Promise<void> => {
    const clientRequestId = clientRequestIdRef.current;
    if (clientRequestId === null || submittedTokenRef.current === clientRequestId) return;
    if (!(isValidDate(paymentDate) && isValidDate(expenseMonth)) || carryoverIds.length === 0) return;
    submittedTokenRef.current = clientRequestId;
    const input: BulkToExpenseInput = {
      carryoverIds: [...carryoverIds],
      paymentDate: formatDateInput(paymentDate),
      expenseDate: format(expenseMonth, EXPENSE_MONTH_FORMAT),
      note: toOptionalNote(note),
      clientRequestId,
    };
    try {
      await bulkToExpense({ variables: { input } });
    } catch (error) {
      // Re-arm the guard so the operator can retry in this dialog session; the
      // reused token keeps the retry idempotent server-side.
      submittedTokenRef.current = null;
      applySubmitError(error);
      return;
    }
    applySubmitSuccess();
  };

  return (
    <Dialog {...DialogPresets.info} open={open} onClose={submitting ? undefined : onClose}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 700 }}>
        {labels.modal.bulkToExpense.title}
        <IconButton aria-label={commonLabels.ariaClose} onClick={onClose} disabled={submitting} size="small">
          <CloseOutlinedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack
          id={FORM_ID}
          component="form"
          // The submit gate (both dates valid) is enforced on the button, so the
          // form opts out of native constraint validation.
          noValidate
          sx={{ gap: 3, pt: 1 }}
          onSubmit={event => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          {alreadyPaidRejected ? <Alert severity="error">{labels.error.alreadyPaid}</Alert> : null}
          {summary.count > 0 ? (
            <Alert severity="info" icon={<InfoOutlinedIcon fontSize="small" />}>
              {labels.modal.bulkToExpense.summary(summary.count, summary.totalAmount, summary.currency ?? "—")}
            </Alert>
          ) : null}
          <Box sx={DATE_PAIR_SX}>
            <AppDatePicker
              label={labels.modal.bulkToExpense.paymentDate}
              value={paymentDate}
              onChange={handlePaymentDateChange}
              disabled={submitting}
              slotProps={{ textField: { required: true, fullWidth: true } }}
            />
            <AppDatePicker
              label={labels.modal.bulkToExpense.expenseDate}
              value={expenseMonth}
              onChange={setExpenseMonth}
              views={["year", "month"]}
              openTo="month"
              format={EXPENSE_MONTH_FORMAT}
              disabled={submitting}
              slotProps={{ textField: { required: true, fullWidth: true } }}
            />
          </Box>
          <TextField
            multiline
            minRows={2}
            label={labels.modal.bulkToExpense.note}
            value={note}
            onChange={event => setNote(event.target.value)}
            fullWidth
            disabled={submitting}
            slotProps={{ htmlInput: { maxLength: CARRYOVER_NOTE_MAX_LENGTH } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          variant="text"
          onClick={onClose}
          disabled={submitting}
          sx={theme => ({ color: theme.palette.text.secondary, fontWeight: 700, borderRadius: 1.5 })}
        >
          {labels.modal.bulkToExpense.cancel}
        </Button>
        <Button
          type="submit"
          form={FORM_ID}
          variant="contained"
          disabled={submitting || !canSubmit}
          aria-busy={submitting}
          sx={{ fontWeight: 700, borderRadius: 1.5 }}
        >
          {submitting ? <CircularProgress size={20} color="inherit" /> : labels.modal.bulkToExpense.submit}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

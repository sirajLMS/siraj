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
  Typography,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useEffect, useMemo, useRef, useState } from "react";
import { DialogPresets } from "@/frontend/common/components/ui/dialog/dialogPresets";
import type { BulkCreateCarryoverInput, CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { bulkCreateCarryoverBalancesMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { formatLockedAmount } from "@/frontend/common/lib/currency";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { getGraphQLErrorMessage } from "@/frontend/common/utils/errorUtils";
import type { SessionAuditReportRow } from "@/frontend/common/views/dashboard/billing/accounting/reports/useSessionAuditReportsViewModel";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingCarryover, Translation } from "@/shared/locale/namespaces";
import type { SessionAuditLabels } from "@/shared/locale/types/dashboard/reports";

/** Root fields dropped from the Apollo cache after a successful bulk creation. */
const CARRYOVER_LIST_FIELD = "carryoverBalances";
const SESSION_AUDIT_REPORT_FIELD = "sessionAuditReport";

/**
 * Selection-fatal domain rejections: the same selection can never succeed, so
 * the dialog surfaces the server-localized reason as a banner and disables the
 * confirm button until the operator closes and re-picks the sessions.
 */
const TERMINAL_REJECTION_CODES: ReadonlySet<string> = new Set([
  "CARRYOVER_SESSION_NOT_AUDITED",
  "CARRYOVER_SESSION_ALREADY_LINKED",
]);

export interface CarryoverBulkCreateDialogProps {
  /** Whether the dialog is visible; every open starts a fresh idempotency session. */
  readonly open: boolean;
  /** The audit rows in the current bulk selection, used for the per-teacher summary and the instance ids. */
  readonly rows: readonly SessionAuditReportRow[];
  /** Localized copy for the carryover section of the session audit report. */
  readonly labels: SessionAuditLabels["carryover"];
  /** Close request raised by Cancel, Escape, backdrop click, or a successful creation. */
  readonly onClose: () => void;
  /** Runs after a successful creation so the host grid can clear the selection. */
  readonly onDone?: () => void;
}

/** Number of decimals used when converting aggregated minutes into hours. */
const HOURS_FRACTION_DIGITS = 1;

interface TeacherGroup {
  readonly teacherId: string;
  readonly teacherName: string;
  /** Selected session ids backing this teacher's carryover balance. */
  readonly count: number;
  /** Distinct students across the teacher's selected sessions. */
  readonly students: number;
  /** Audited duration (calculated, falling back to scheduled) in whole minutes. */
  readonly totalMinutes: number;
  /** Sum of the audited session payouts, kept numeric for the totals row. */
  readonly totalPaid: number;
  /** Currency of the teacher's audited payouts (first seen wins). */
  readonly currency: CurrencyCode | null;
}

interface TotalsSummary {
  readonly sessions: number;
  readonly students: number;
  readonly totalMinutes: number;
  readonly totalPaid: number;
  readonly currency: CurrencyCode | null;
}

/** Audited minutes for a row: actual calculated duration first, scheduled as fallback. */
function rowMinutes(row: SessionAuditReportRow): number {
  if (typeof row.calculatedDuration === "number") return row.calculatedDuration;
  return row.durationMinutes ?? 0;
}

/** Session payout kept numeric for aggregation; unparseable cells read as zero. */
function rowPaidAmount(row: SessionAuditReportRow): number {
  if (row.teacherPaidAmount === null) return 0;
  const parsed = Number.parseFloat(row.teacherPaidAmount);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Mutable per-teacher accumulator used while folding the selected rows. */
interface TeacherGroupDraft {
  teacherId: string;
  teacherName: string;
  count: number;
  totalMinutes: number;
  totalPaid: number;
  currency: CurrencyCode | null;
  readonly studentIds: Set<string>;
}

/** Groups the selected rows by teacher, preserving first-seen order for the summary list. */
function groupRowsByTeacher(rows: readonly SessionAuditReportRow[]): TeacherGroup[] {
  const groups = new Map<string, TeacherGroupDraft>();
  for (const row of rows) {
    const teacherId = row.teacherId ?? "";
    let draft = groups.get(teacherId);
    if (draft === undefined) {
      draft = {
        teacherId,
        teacherName: row.teacherName ?? "",
        count: 0,
        totalMinutes: 0,
        totalPaid: 0,
        currency: null,
        studentIds: new Set<string>(),
      };
      groups.set(teacherId, draft);
    }
    if (row.studentId !== null) draft.studentIds.add(row.studentId);
    draft.count += 1;
    draft.totalMinutes += rowMinutes(row);
    draft.totalPaid += rowPaidAmount(row);
    draft.currency ??= row.teacherPaidCurrency;
  }
  return [...groups.values()].map(({ studentIds, ...draft }) => Object.assign(draft, { students: studentIds.size }));
}

/** Whole-selection totals for the breakdown footer, summed per shared currency. */
function summarizeTotals(rows: readonly SessionAuditReportRow[], groups: readonly TeacherGroup[]): TotalsSummary {
  const studentIds = new Set<string>();
  let totalMinutes = 0;
  let totalPaid = 0;
  for (const row of rows) {
    if (row.studentId !== null) studentIds.add(row.studentId);
    totalMinutes += rowMinutes(row);
    totalPaid += rowPaidAmount(row);
  }
  const currencies = new Set(groups.flatMap(group => (group.currency === null ? [] : [group.currency])));
  return {
    sessions: rows.length,
    students: studentIds.size,
    totalMinutes,
    totalPaid,
    currency: currencies.size === 1 ? ([...currencies][0] ?? null) : null,
  };
}

/** Renders minutes as locale-aware hours matching the "Duration (h)" header. */
function formatHours(minutes: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: HOURS_FRACTION_DIGITS }).format(minutes / 60);
}

/** Money cell: currency snapshot when known, the shared muted dash otherwise. */
function formatPayable(amount: number, currency: CurrencyCode | null, locale: string): string {
  if (currency === null) return "—";
  return formatLockedAmount(amount.toFixed(2), currency, locale);
}

/** Instances selected for the bulk creation; report rows always carry an instance id. */
function selectedInstanceIds(rows: readonly SessionAuditReportRow[]): string[] {
  return rows.flatMap(row => (row.instanceId === null ? [] : [row.instanceId]));
}

interface BreakdownTableProps {
  readonly groups: readonly TeacherGroup[];
  readonly totals: TotalsSummary;
  readonly locale: string;
  /** Localized per-row composer and selection totals caption. */
  readonly cellLabels: {
    readonly teacherLine: (teacherName: string, count: number) => string;
    readonly totalsLabel: (count: number) => string;
  };
  /** Column headers (Teacher / Students / Duration (h) / Payable). */
  readonly columnLabels: {
    readonly teacher: string;
    readonly students: string;
    readonly hours: string;
    readonly payable: string;
  };
}

const TABLE_SX = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  "& th": { py: 0.5 },
  "& td": { py: 1 },
} as const;

const NUMERIC_CELL_SX = { textAlign: "end" } as const;

const HEADER_LABEL_SX = (theme: Theme) => ({ color: theme.palette.onSurfaceVariant });

/** Per-teacher breakdown of the pending carryover balances with a totals footer row. */
function BreakdownTable({ groups, totals, locale, cellLabels, columnLabels }: Readonly<BreakdownTableProps>) {
  return (
    <Box component="table" sx={TABLE_SX}>
      <Box component="colgroup">
        <Box component="col" style={{ width: "auto" }} />
        <Box component="col" style={{ width: "68px" }} />
        <Box component="col" style={{ width: "96px" }} />
        <Box component="col" style={{ width: "110px" }} />
      </Box>
      <Box component="thead">
        <Box component="tr">
          <Box component="th" sx={{ textAlign: "start" }}>
            <Typography variant="labelUppercase" sx={HEADER_LABEL_SX}>
              {columnLabels.teacher}
            </Typography>
          </Box>
          <Box component="th" sx={NUMERIC_CELL_SX}>
            <Typography variant="labelUppercase" sx={HEADER_LABEL_SX}>
              {columnLabels.students}
            </Typography>
          </Box>
          <Box component="th" sx={NUMERIC_CELL_SX}>
            <Typography variant="labelUppercase" sx={HEADER_LABEL_SX}>
              {columnLabels.hours}
            </Typography>
          </Box>
          <Box component="th" sx={NUMERIC_CELL_SX}>
            <Typography variant="labelUppercase" sx={HEADER_LABEL_SX}>
              {columnLabels.payable}
            </Typography>
          </Box>
        </Box>
      </Box>
      <Box component="tbody">
        {groups.map(group => (
          <Box component="tr" key={group.teacherId}>
            <Box component="td" sx={{ minWidth: 0 }}>
              <Typography variant="bodyMd" noWrap>
                {cellLabels.teacherLine(group.teacherName, group.count)}
              </Typography>
            </Box>
            <Box component="td" sx={NUMERIC_CELL_SX}>
              <Typography variant="bodyMd">{group.students}</Typography>
            </Box>
            <Box component="td" sx={NUMERIC_CELL_SX}>
              <Typography variant="bodyMd">{formatHours(group.totalMinutes, locale)}</Typography>
            </Box>
            <Box component="td" sx={NUMERIC_CELL_SX}>
              <Box component="span" dir="ltr" sx={{ typography: "bodyMd", display: "block" }}>
                {formatPayable(group.totalPaid, group.currency, locale)}
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
      <Box component="tfoot">
        <Box component="tr">
          <Box component="td" sx={theme => ({ borderTop: `1px solid ${theme.palette.outlineVariant}` })}>
            <Typography variant="labelUppercase" sx={HEADER_LABEL_SX}>
              {cellLabels.totalsLabel(totals.sessions)}
            </Typography>
          </Box>
          <Box
            component="td"
            sx={theme => ({ ...NUMERIC_CELL_SX, borderTop: `1px solid ${theme.palette.outlineVariant}` })}
          >
            <Typography variant="bodyMd" sx={{ fontWeight: 700 }}>
              {totals.students}
            </Typography>
          </Box>
          <Box
            component="td"
            sx={theme => ({ ...NUMERIC_CELL_SX, borderTop: `1px solid ${theme.palette.outlineVariant}` })}
          >
            <Typography variant="bodyMd" sx={{ fontWeight: 700 }}>
              {formatHours(totals.totalMinutes, locale)}
            </Typography>
          </Box>
          <Box
            component="td"
            sx={theme => ({ ...NUMERIC_CELL_SX, borderTop: `1px solid ${theme.palette.outlineVariant}` })}
          >
            <Box component="span" dir="ltr" sx={{ typography: "bodyMd", display: "block", fontWeight: 700 }}>
              {formatPayable(totals.totalPaid, totals.currency, locale)}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function getGraphQLErrorCode(error: unknown): string | undefined {
  if (!CombinedGraphQLErrors.is(error)) return undefined;
  const code: unknown = error.errors[0]?.extensions?.code;
  return typeof code === "string" ? code : undefined;
}

/**
 * Confirmation dialog behind the audit grid's Carryover Balance bulk action:
 * summarizes the selected audited sessions grouped per teacher, then submits a
 * single idempotent bulk-create mutation. One idempotency token is minted per
 * dialog session so a double-click produces exactly one server write while a
 * failed submission can still be retried inside the same session.
 */
export function CarryoverBulkCreateDialog({
  open,
  rows,
  labels,
  onClose,
  onDone,
}: Readonly<CarryoverBulkCreateDialogProps>) {
  const carryoverLabels = useAppTranslation(DashboardAccountingCarryover);
  const commonLabels = useAppTranslation(Translation.Common);
  const notifications = useNotifications();
  const client = useApolloClient();
  const locale = useAppLocale();

  const [rejectionMessage, setRejectionMessage] = useState<string | null>(null);

  // One idempotency token per dialog session: re-opening starts a fresh
  // creation, while retries inside the same session reuse the token so the
  // server-side idempotency window absorbs double submissions.
  const clientRequestIdRef = useRef<string | null>(null);
  const submittedTokenRef = useRef<string | null>(null);

  const [bulkCreate, { loading: submitting }] = useMutation(bulkCreateCarryoverBalancesMutationDocument, {
    // Domain errors reject with CombinedGraphQLErrors carrying extensions.code.
    errorPolicy: "none",
  });

  // A new open session drops the previous session's rejection banner during
  // render (render-phase state adjustment) so no cascading effect fires.
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setRejectionMessage(null);
    }
  }

  useEffect(() => {
    if (!open) return;
    clientRequestIdRef.current = crypto.randomUUID();
    submittedTokenRef.current = null;
  }, [open]);

  const teacherGroups = useMemo(() => groupRowsByTeacher(rows), [rows]);
  const totals = useMemo(() => summarizeTotals(rows, teacherGroups), [rows, teacherGroups]);
  const instanceIds = selectedInstanceIds(rows);
  const canSubmit = instanceIds.length > 0 && rejectionMessage === null;

  const applySubmitSuccess = (groupCount: number) => {
    // Both root fields served from the cache are stale after creation: the
    // carryover list gains rows and every linked audit row flips to "Linked".
    client.cache.evict({ fieldName: CARRYOVER_LIST_FIELD });
    client.cache.evict({ fieldName: SESSION_AUDIT_REPORT_FIELD });
    client.cache.gc();
    notifications.show(carryoverLabels.success.bulkCreated(groupCount), { severity: "success" });
    onDone?.();
    onClose();
  };

  const applySubmitError = (error: unknown) => {
    const code = getGraphQLErrorCode(error);
    if (code !== undefined && TERMINAL_REJECTION_CODES.has(code)) {
      // Service-level messages arrive already localized; surface them directly.
      setRejectionMessage(getGraphQLErrorMessage(error, commonLabels.operationFailed));
      return;
    }
    notifications.show(getGraphQLErrorMessage(error, commonLabels.operationFailed), { severity: "error" });
  };

  const handleSubmit = async (): Promise<void> => {
    const clientRequestId = clientRequestIdRef.current;
    if (clientRequestId === null || submittedTokenRef.current === clientRequestId) return;
    if (instanceIds.length === 0 || rejectionMessage !== null) return;
    submittedTokenRef.current = clientRequestId;
    const input: BulkCreateCarryoverInput = { instanceIds, note: null, clientRequestId };
    try {
      const { data } = await bulkCreate({ variables: { input } });
      applySubmitSuccess(data?.bulkCreateCarryoverBalances?.groups?.length ?? 0);
    } catch (error) {
      // Re-arm the guard so the operator can retry in this dialog session; the
      // reused token keeps the retry idempotent server-side.
      submittedTokenRef.current = null;
      applySubmitError(error);
    }
  };

  return (
    <Dialog {...DialogPresets.info} open={open} onClose={submitting ? undefined : onClose}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 700 }}>
        {labels.dialog.title}
        <IconButton aria-label={commonLabels.ariaClose} onClick={onClose} disabled={submitting} size="small">
          <CloseOutlinedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack sx={{ gap: 2, pt: 1 }}>
          {rejectionMessage !== null ? <Alert severity="error">{rejectionMessage}</Alert> : null}
          <Alert severity="info" icon={<InfoOutlinedIcon fontSize="small" />}>
            {labels.dialog.intro}
          </Alert>
          <Box component="p" sx={{ typography: "bodyMd", m: 0 }}>
            {carryoverLabels.modal.bulkCreate.groupedSummary(totals.sessions, teacherGroups.length)}
          </Box>
          <BreakdownTable
            groups={teacherGroups}
            totals={totals}
            locale={locale}
            cellLabels={{ teacherLine: labels.dialog.teacherLine, totalsLabel: labels.dialog.totalSessions }}
            columnLabels={{
              teacher: carryoverLabels.column.teacher,
              students: carryoverLabels.column.studentsCount,
              hours: carryoverLabels.column.totalDuration,
              payable: carryoverLabels.column.payable,
            }}
          />
          <Alert severity="warning">{carryoverLabels.modal.bulkCreate.groupedConsequence}</Alert>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          variant="text"
          onClick={onClose}
          disabled={submitting}
          sx={theme => ({ color: theme.palette.text.secondary, fontWeight: 700, borderRadius: 1.5 })}
        >
          {labels.dialog.cancel}
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            void handleSubmit();
          }}
          disabled={submitting || !canSubmit}
          aria-busy={submitting}
          sx={{ fontWeight: 700, borderRadius: 1.5 }}
        >
          {submitting ? <CircularProgress size={20} color="inherit" /> : labels.dialog.confirm}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

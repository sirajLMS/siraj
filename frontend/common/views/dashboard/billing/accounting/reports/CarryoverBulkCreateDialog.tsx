"use client";

import { CombinedGraphQLErrors } from "@apollo/client";
import { useApolloClient, useMutation } from "@apollo/client/react";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  Alert,
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
import { useNotifications } from "@toolpad/core/useNotifications";
import { useEffect, useRef, useState } from "react";
import { DialogPresets } from "@/frontend/common/components/ui/dialog/dialogPresets";
import type { BulkCreateCarryoverInput } from "@/frontend/common/graphql/generated/gql/graphql";
import { bulkCreateCarryoverBalancesMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
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

interface TeacherGroup {
  readonly teacherId: string;
  readonly teacherName: string;
  readonly count: number;
}

/** Groups the selected rows by teacher, preserving first-seen order for the summary list. */
function groupRowsByTeacher(rows: readonly SessionAuditReportRow[]): TeacherGroup[] {
  const groups = new Map<string, TeacherGroup>();
  for (const row of rows) {
    const teacherId = row.teacherId ?? "";
    const existing = groups.get(teacherId);
    if (existing !== undefined) {
      groups.set(teacherId, { ...existing, count: existing.count + 1 });
    } else {
      groups.set(teacherId, { teacherId, teacherName: row.teacherName ?? "", count: 1 });
    }
  }
  return [...groups.values()];
}

/** Instances selected for the bulk creation; report rows always carry an instance id. */
function selectedInstanceIds(rows: readonly SessionAuditReportRow[]): string[] {
  return rows.flatMap(row => (row.instanceId === null ? [] : [row.instanceId]));
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

  const teacherGroups = groupRowsByTeacher(rows);
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
          <Stack component="ul" sx={{ m: 0, pl: 3, gap: 0.5 }}>
            {teacherGroups.map(group => (
              <Typography key={group.teacherId} component="li" variant="bodyMd">
                {labels.dialog.teacherLine(group.teacherName, group.count)}
              </Typography>
            ))}
          </Stack>
          <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {labels.dialog.totalSessions(instanceIds.length)}
          </Typography>
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

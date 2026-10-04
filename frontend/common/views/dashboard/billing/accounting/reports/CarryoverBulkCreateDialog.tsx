"use client";

import { useApolloClient, useMutation } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useEffect, useMemo, useRef, useState } from "react";
import type { BulkCreateCarryoverInput } from "@/frontend/common/graphql/generated/gql/graphql";
import { bulkCreateCarryoverBalancesMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { getGraphQLErrorMessage } from "@/frontend/common/utils/errorUtils";
import {
  CARRYOVER_LIST_FIELD,
  getGraphQLErrorCode,
  groupRowsByTeacher,
  SESSION_AUDIT_REPORT_FIELD,
  selectedInstanceIds,
  summarizeTotals,
  TERMINAL_REJECTION_CODES,
} from "@/frontend/common/views/dashboard/billing/accounting/reports/CarryoverBulkCreateDialog.helpers";
import { CarryoverDialogPanel } from "@/frontend/common/views/dashboard/billing/accounting/reports/CarryoverBulkCreateDialog.panel";
import type { SessionAuditReportRow } from "@/frontend/common/views/dashboard/billing/accounting/reports/useSessionAuditReportsViewModel";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingCarryover, Translation } from "@/shared/locale/namespaces";
import type { SessionAuditLabels } from "@/shared/locale/types/dashboard/reports";

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
    <CarryoverDialogPanel
      open={open}
      submitting={submitting}
      canSubmit={canSubmit}
      rejectionMessage={rejectionMessage}
      title={labels.dialog.title}
      closeAriaLabel={commonLabels.ariaClose}
      cancelLabel={labels.dialog.cancel}
      confirmLabel={labels.dialog.confirm}
      intro={labels.dialog.intro}
      groupedSummary={carryoverLabels.modal.bulkCreate.groupedSummary(totals.sessions, teacherGroups.length)}
      consequence={carryoverLabels.modal.bulkCreate.groupedConsequence}
      locale={locale}
      teacherGroups={teacherGroups}
      totals={totals}
      cellLabels={{ teacherLine: labels.dialog.teacherLine, totalsLabel: labels.dialog.totalSessions }}
      columnLabels={{
        teacher: carryoverLabels.column.teacher,
        students: carryoverLabels.column.studentsCount,
        hours: carryoverLabels.column.totalDuration,
        payable: carryoverLabels.column.payable,
      }}
      onClose={onClose}
      onSubmit={() => {
        void handleSubmit();
      }}
    />
  );
}

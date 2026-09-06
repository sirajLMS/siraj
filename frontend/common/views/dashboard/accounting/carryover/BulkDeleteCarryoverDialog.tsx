"use client";

import { useApolloClient, useMutation } from "@apollo/client/react";
import { Box } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { bulkDeleteCarryoverBalancesMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { getGraphQLErrorMessage } from "@/frontend/common/utils/errorUtils";
import { formatAccountingMoney } from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import {
  type CarryoverConfirmDetail,
  CarryoverConfirmDetails,
  type CarryoverConfirmRow,
  CarryoverConfirmScaffold,
} from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverConfirmScaffold";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingCarryover, Translation } from "@/shared/locale/namespaces";

/** Root field holding the carryover list page; dropped after writes because aggregates depend on every row. */
const CARRYOVER_LIST_FIELD = "carryoverBalances";

export interface BulkDeleteCarryoverDialogProps {
  readonly open: boolean;
  /** Selected rows restated in the confirmation; the mutation removes all of them atomically. */
  readonly rows: readonly CarryoverConfirmRow[];
  readonly onClose: () => void;
  /** Runs after a successful bulk delete so the host can reset its selection state. */
  readonly onDone: () => void;
}

/** Restates each targeted carryover as a teacher + payable line in the confirm summary. */
function buildBulkDeleteDetails(rows: readonly CarryoverConfirmRow[]): CarryoverConfirmDetail[] {
  return rows.map(row => ({
    label: row.teacherName ?? "—",
    value: `${formatAccountingMoney(row.payable)} ${row.teacherCurrency ?? ""}`.trim(),
  }));
}

/**
 * Multi-row variant of the delete confirmation: the server applies the batch
 * in one transaction and rejects the whole call when any row is already paid.
 */
export function BulkDeleteCarryoverDialog({ open, rows, onClose, onDone }: Readonly<BulkDeleteCarryoverDialogProps>) {
  const labels = useAppTranslation(DashboardAccountingCarryover);
  const commonLabels = useAppTranslation(Translation.Common);
  const client = useApolloClient();
  const notifications = useNotifications();
  const [runMutation, { loading }] = useMutation(bulkDeleteCarryoverBalancesMutationDocument, {
    // Domain errors reject with CombinedGraphQLErrors carrying extensions.code.
    errorPolicy: "none",
  });
  const ids = useMemo(() => rows.map(row => row.id).filter((id): id is string => id !== null), [rows]);
  const details = useMemo(() => buildBulkDeleteDetails(rows), [rows]);

  const startedRef = useRef(false);
  useEffect(() => {
    if (open) startedRef.current = false;
  }, [open]);

  const confirm = useCallback(() => {
    const run = async (): Promise<void> => {
      if (startedRef.current || ids.length === 0) return;
      startedRef.current = true;
      try {
        await runMutation({ variables: { ids } });
      } catch (error: unknown) {
        startedRef.current = false;
        notifications.show(getGraphQLErrorMessage(error, commonLabels.operationFailed), { severity: "error" });
        return;
      }
      client.cache.evict({ fieldName: CARRYOVER_LIST_FIELD });
      client.cache.gc();
      notifications.show(labels.success.bulkDeleted(ids.length), { severity: "success" });
      onDone();
      onClose();
    };
    void run();
  }, [ids, runMutation, client, notifications, labels, commonLabels, onDone, onClose]);

  return (
    <CarryoverConfirmScaffold
      open={open}
      busy={loading}
      title={labels.action.bulkDelete}
      cancelLabel={labels.modal.delete.cancel}
      confirmLabel={labels.modal.delete.confirm}
      closeAriaLabel={commonLabels.ariaClose}
      onClose={onClose}
      onConfirm={confirm}
    >
      <Box sx={{ pt: 1 }}>
        <CarryoverConfirmDetails details={details} />
      </Box>
    </CarryoverConfirmScaffold>
  );
}

"use client";

import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import { Box, Typography } from "@mui/material";
import { useCallback } from "react";
import { deleteCarryoverBalanceMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { formatAccountingMoney } from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import {
  CarryoverConfirmDetails,
  type CarryoverConfirmRow,
  CarryoverConfirmScaffold,
} from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverConfirmScaffold";
import { useCarryoverConfirmAction } from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverConfirmAction";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingCarryover, Translation } from "@/shared/locale/namespaces";

export interface DeleteCarryoverDialogProps {
  readonly open: boolean;
  /** Row snapshot the confirmation restates; `null` keeps the confirm action inert. */
  readonly row: CarryoverConfirmRow | null;
  /** Close request raised by Cancel, Escape, backdrop click, or a successful delete. */
  readonly onClose: () => void;
  /** Runs after a successful delete so the host page can reset row state. */
  readonly onDone: () => void;
}

export function DeleteCarryoverDialog({ open, row, onClose, onDone }: Readonly<DeleteCarryoverDialogProps>) {
  const labels = useAppTranslation(DashboardAccountingCarryover);
  const commonLabels = useAppTranslation(Translation.Common);

  const buildVariables = useCallback(
    (target: CarryoverConfirmRow) => (target.id === null ? null : { id: target.id }),
    []
  );

  const action = useCarryoverConfirmAction({
    open,
    row,
    document: deleteCarryoverBalanceMutationDocument,
    buildVariables,
    successMessage: labels.success.deleted,
    fallbackErrorMessage: commonLabels.operationFailed,
    onClose,
    onDone,
  });

  const payableValue = row === null ? "—" : `${formatAccountingMoney(row.payable)} ${row.teacherCurrency ?? ""}`.trim();
  const details = [
    { label: labels.column.teacher, value: row?.teacherName ?? "—" },
    { label: labels.column.payable, value: payableValue },
  ];

  // Hard deletes unlink sessions and restore their pre-link audit status; the
  // warning surfaces only when the row is known to still have links.
  const linkedSessionCount = row?.linkedSessionCount ?? 0;

  return (
    <CarryoverConfirmScaffold
      open={open}
      busy={action.busy}
      title={labels.modal.delete.title}
      cancelLabel={labels.modal.delete.cancel}
      confirmLabel={labels.modal.delete.confirm}
      closeAriaLabel={commonLabels.ariaClose}
      onClose={onClose}
      onConfirm={action.confirm}
    >
      <Box sx={{ display: "grid", gap: 2, pt: 1 }}>
        <CarryoverConfirmDetails details={details} />
        {linkedSessionCount > 0 && (
          <Box
            sx={theme => ({
              display: "flex",
              gap: 1,
              p: 1.5,
              borderRadius: 1.5,
              backgroundColor: theme.palette.warningContainer,
              color: theme.palette.onWarningContainer,
            })}
          >
            <WarningAmberOutlined fontSize="small" aria-hidden />
            <Typography variant="bodyMd">{labels.modal.delete.linkedSessionsWarning(linkedSessionCount)}</Typography>
          </Box>
        )}
      </Box>
    </CarryoverConfirmScaffold>
  );
}

"use client";

import { useCallback } from "react";
import {
  NumbersCreateEditDialogs,
  NumbersLocalDeactivateConfirmDialog,
} from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/__shared__";
import type { NumbersTabSharedProps } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps";
import { CredentialEditDialog } from "@/frontend/desktop/views/dashboard/settings/whatsapp/tabs/NumbersTab.desktop.credentialDialog";
import type { CredentialDialogState } from "@/frontend/desktop/views/dashboard/settings/whatsapp/tabs/NumbersTab.desktop.helpers";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

export function NumbersTabDialogs({
  labels,
  props,
  dialogOpen,
  dialogMode,
  handleDialogClose,
  handleDialogConfirm,
}: Readonly<{
  readonly labels: WhatsappLabels;
  readonly props: Readonly<NumbersTabSharedProps>;
  readonly dialogOpen: boolean;
  readonly dialogMode: CredentialDialogState;
  readonly handleDialogClose: () => void;
  readonly handleDialogConfirm: (value: string) => Promise<void>;
}>) {
  const t = labels;
  const {
    onLocalDeactivateAccount,
    onCreate,
    onEditName,
    onUpdatePurpose,
    onCloseDialog,
    validateDisplayName,
    validatePhoneNumberId,
    validateWabaId,
    validatePurpose,
  } = props;

  const handleLocalDeactivateConfirm = useCallback(async () => {
    const accountId = props.dialogState.accountId;
    if (!accountId) return;
    await onLocalDeactivateAccount(accountId);
    onCloseDialog();
  }, [props.dialogState.accountId, onLocalDeactivateAccount, onCloseDialog]);

  return (
    <>
      <CredentialEditDialog
        open={dialogOpen}
        state={dialogMode}
        labels={t}
        onClose={handleDialogClose}
        onConfirm={handleDialogConfirm}
        onTest={props.onTestAccessToken}
        tokenTestStates={props.tokenTestStates}
      />

      <NumbersLocalDeactivateConfirmDialog
        open={props.dialogState.type === "localDeactivateConfirm"}
        displayName={props.dialogState.displayName ?? ""}
        labels={t}
        onClose={onCloseDialog}
        onConfirm={handleLocalDeactivateConfirm}
        fullScreen={false}
      />

      <NumbersCreateEditDialogs
        labels={t}
        dialogState={props.dialogState}
        creating={props.creating}
        updatingId={props.updatingId}
        mutationError={props.mutationError}
        onCreate={onCreate}
        onEditName={onEditName}
        onUpdatePurpose={onUpdatePurpose}
        onCloseDialog={onCloseDialog}
        validateDisplayName={validateDisplayName}
        validatePhoneNumberId={validatePhoneNumberId}
        validateWabaId={validateWabaId}
        validatePurpose={validatePurpose}
      />
    </>
  );
}

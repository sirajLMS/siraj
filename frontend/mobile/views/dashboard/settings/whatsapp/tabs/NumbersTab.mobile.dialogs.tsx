"use client";

import { EmbeddedSignupDialog } from "@/frontend/common/views/dashboard/settings/whatsapp/embeddedSignup";
import {
  NumbersCreateEditDialogs,
  NumbersLocalDeactivateConfirmDialog,
} from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/__shared__";
import { NumbersSnackbar } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/components/NumbersSnackbar";
import type { NumbersTabSharedProps } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps";
import { TestRecipientsManageDialog } from "@/frontend/common/views/dashboard/whatsapp/conversations/TestRecipientsManageDialog";
import { CredentialEditDialogMobile } from "@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/NumbersTab.mobile.credentialDialog";
import type { CredentialDialogState } from "@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/NumbersTab.mobile.helpers";

interface NumbersTabDialogsMobileProps {
  readonly props: Readonly<NumbersTabSharedProps>;
  readonly credDialogOpen: boolean;
  readonly credDialogState: CredentialDialogState;
  readonly credValidate: (value: string) => string | null;
  readonly credLoading: boolean;
  readonly handleCredDialogClose: () => void;
  readonly handleCredDialogConfirm: (value: string) => Promise<void>;
  readonly handleLocalDeactivateConfirm: () => Promise<void>;
}

export function NumbersTabDialogsMobile({
  props,
  credDialogOpen,
  credDialogState,
  credValidate,
  credLoading,
  handleCredDialogClose,
  handleCredDialogConfirm,
  handleLocalDeactivateConfirm,
}: Readonly<NumbersTabDialogsMobileProps>) {
  const t = props.labels.page;
  const dialogState = props.dialogState;

  return (
    <>
      <NumbersLocalDeactivateConfirmDialog
        open={dialogState.type === "localDeactivateConfirm"}
        displayName={dialogState.displayName ?? ""}
        labels={t}
        onClose={props.onCloseDialog}
        onConfirm={handleLocalDeactivateConfirm}
        fullScreen={true}
      />

      <CredentialEditDialogMobile
        key={`${credDialogState.accountId}-${credDialogState.field}`}
        open={credDialogOpen}
        state={credDialogState}
        labels={t}
        onClose={handleCredDialogClose}
        onConfirm={handleCredDialogConfirm}
        onTest={props.onTestAccessToken}
        tokenTestStates={props.tokenTestStates}
        loading={credLoading}
        validate={credValidate}
      />

      <NumbersCreateEditDialogs
        labels={t}
        dialogState={dialogState}
        creating={props.creating}
        updatingId={props.updatingId}
        mutationError={props.mutationError}
        onCreate={props.onCreate}
        onEditName={props.onEditName}
        onUpdatePurpose={props.onUpdatePurpose}
        onCloseDialog={props.onCloseDialog}
        validateDisplayName={props.validateDisplayName}
        validatePhoneNumberId={props.validatePhoneNumberId}
        validateWabaId={props.validateWabaId}
        validatePurpose={props.validatePurpose}
      />

      {props.onEmbeddedSignupComplete ? (
        <EmbeddedSignupDialog
          open={dialogState.type === "embeddedSignup"}
          fullScreen={true}
          labels={t}
          configId={props.esConfigId ?? null}
          appId={props.esAppId ?? null}
          allowedOriginsUrl={props.embeddedSignupAllowedOriginsUrl}
          onComplete={props.onEmbeddedSignupComplete}
          onClose={props.onCloseDialog}
        />
      ) : null}

      {dialogState.type === "manageRecipients" && dialogState.accountId ? (
        <TestRecipientsManageDialog
          accountId={dialogState.accountId}
          open={true}
          onClose={props.onCloseDialog}
          fullScreen={true}
        />
      ) : null}

      <NumbersSnackbar state={props.snackbar} onClose={props.onDismissSnackbar} />
    </>
  );
}

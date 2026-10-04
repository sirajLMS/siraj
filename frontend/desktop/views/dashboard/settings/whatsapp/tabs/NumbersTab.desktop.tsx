"use client";

import { Box, CircularProgress } from "@mui/material";
import { EmbeddedSignupDialog } from "@/frontend/common/views/dashboard/settings/whatsapp/embeddedSignup";
import { MetaNumbersLinkShared } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/__shared__";
import { NumbersSnackbar } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/components/NumbersSnackbar";
import type { NumbersTabSharedProps } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps";
import type { WhatsappAccountRow } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import { TestRecipientsManageDialog } from "@/frontend/common/views/dashboard/whatsapp/conversations/TestRecipientsManageDialog";
import { AccountsListSection } from "@/frontend/desktop/views/dashboard/settings/whatsapp/tabs/NumbersTab.desktop.accountsList";
import { NumbersTabDialogs } from "@/frontend/desktop/views/dashboard/settings/whatsapp/tabs/NumbersTab.desktop.dialogs";
import type {
  CredentialDialogField,
  CredentialDialogState,
} from "@/frontend/desktop/views/dashboard/settings/whatsapp/tabs/NumbersTab.desktop.helpers";
import { useCredentialMenuState } from "@/frontend/desktop/views/dashboard/settings/whatsapp/tabs/NumbersTab.desktop.hooks";
import {
  AccountActionMenu,
  NumbersHeaderDesktop,
} from "@/frontend/desktop/views/dashboard/settings/whatsapp/tabs/NumbersTab.desktop.parts";

function NumbersDesktopBody({
  props,
  anchorEl,
  dialogMode,
  dialogOpen,
  handleMenuOpen,
  handleMenuClose,
  handleEditNameFromMenu,
  openCredentialDialog,
  handleDialogClose,
  handleDialogConfirm,
}: Readonly<{
  props: Readonly<NumbersTabSharedProps>;
  anchorEl: HTMLElement | null;
  dialogMode: CredentialDialogState;
  dialogOpen: boolean;
  handleMenuOpen: (event: React.MouseEvent<HTMLElement>, account: WhatsappAccountRow) => void;
  handleMenuClose: () => void;
  handleEditNameFromMenu: () => void;
  openCredentialDialog: (field: CredentialDialogField) => void;
  handleDialogClose: () => void;
  handleDialogConfirm: (value: string) => Promise<void>;
}>) {
  const t = props.labels.page;
  return (
    <Box>
      <NumbersHeaderDesktop
        labels={t}
        syncing={props.syncing}
        isConfigured={props.isConfigured}
        syncDisabledReason={props.syncDisabledReason}
        onSyncFromMeta={props.onSyncFromMeta}
        onOpenCreateDialog={props.onOpenCreateDialog}
        esConfigId={props.esConfigId}
        esAppId={props.esAppId}
        onOpenEmbeddedSignup={props.onOpenEmbeddedSignup}
        embeddedSignupBlocked={props.embeddedSignupBlocked ?? false}
      />

      <MetaNumbersLinkShared labels={t} />

      <AccountsListSection
        labels={t}
        accounts={props.accounts}
        localDeactivatingId={props.localDeactivatingId}
        syncingId={props.syncingId}
        onMenuOpen={handleMenuOpen}
        onLocalDeactivateConfirmDialog={props.onLocalDeactivateConfirmDialog}
        onAddAccount={props.onOpenCreateDialog}
        onRetrySetup={props.esConfigId && props.esAppId ? props.onOpenEmbeddedSignup : undefined}
        manageRecipientsLabel={t.manageRecipients}
        onOpenManageRecipients={props.onOpenManageRecipients}
      />

      <AccountActionMenu
        labels={t}
        anchorEl={anchorEl}
        onClose={handleMenuClose}
        onEditName={handleEditNameFromMenu}
        onOpenCredentialDialog={openCredentialDialog}
      />

      <NumbersTabDialogs
        labels={t}
        props={props}
        dialogOpen={dialogOpen}
        dialogMode={dialogMode}
        handleDialogClose={handleDialogClose}
        handleDialogConfirm={handleDialogConfirm}
      />

      {props.onEmbeddedSignupComplete ? (
        <EmbeddedSignupDialog
          open={props.dialogState.type === "embeddedSignup"}
          fullScreen={false}
          labels={t}
          configId={props.esConfigId ?? null}
          appId={props.esAppId ?? null}
          allowedOriginsUrl={props.embeddedSignupAllowedOriginsUrl ?? null}
          onComplete={props.onEmbeddedSignupComplete}
          onClose={props.onCloseDialog}
        />
      ) : null}

      {props.dialogState.type === "manageRecipients" && props.dialogState.accountId ? (
        <TestRecipientsManageDialog accountId={props.dialogState.accountId} open={true} onClose={props.onCloseDialog} />
      ) : null}

      <NumbersSnackbar state={props.snackbar} onClose={props.onDismissSnackbar} />
    </Box>
  );
}

export function NumbersTabDesktop(props: Readonly<NumbersTabSharedProps>) {
  const { onSetAccessToken, onSetTwoStepPin, onOpenEditNameDialog, loading } = props;
  const menuState = useCredentialMenuState(onSetAccessToken, onSetTwoStepPin, onOpenEditNameDialog);

  if (loading) {
    return (
      <Box component="output" sx={{ display: "flex", justifyContent: "center", py: 4 }} aria-busy>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return <NumbersDesktopBody props={props} {...menuState} />;
}

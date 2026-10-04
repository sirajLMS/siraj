"use client";

import { Box, Stack, Typography } from "@mui/material";
import { MetaNumbersLinkShared } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/__shared__";
import type { NumbersTabSharedProps } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps";
import { AccountsListMobile } from "@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/NumbersTab.mobile.accountsList";
import { SkeletonAccountCard } from "@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/NumbersTab.mobile.cardParts";
import { NumbersTabDialogsMobile } from "@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/NumbersTab.mobile.dialogs";
import {
  useMobileCredMenuState,
  useNumbersMenuHandlers,
} from "@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/NumbersTab.mobile.hooks";
import {
  AccountActionMenuMobile,
  NumbersHeaderMobile,
} from "@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/NumbersTab.mobile.parts";

function NumbersTabMobileBody({
  props,
  credMenu,
  handlers,
}: Readonly<{
  readonly props: Readonly<NumbersTabSharedProps>;
  readonly credMenu: Readonly<ReturnType<typeof useMobileCredMenuState>>;
  readonly handlers: Readonly<ReturnType<typeof useNumbersMenuHandlers>>;
}>) {
  const t = props.labels.page;
  const openEmbeddedSignup = props.onOpenEmbeddedSignup;
  const onConnectBusinessApp =
    props.esConfigId && props.esAppId && openEmbeddedSignup
      ? () => {
          openEmbeddedSignup();
        }
      : undefined;

  return (
    <Box sx={{ p: 2 }}>
      <NumbersHeaderMobile
        labels={t}
        syncing={props.syncing}
        isConfigured={props.isConfigured}
        syncDisabledReason={props.syncDisabledReason}
        onSyncFromMeta={props.onSyncFromMeta}
        onAddAccount={props.onOpenCreateDialog}
        onConnectBusinessApp={onConnectBusinessApp}
        embeddedSignupBlocked={props.embeddedSignupBlocked ?? false}
      />

      <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, mb: 2 }}>
        {t.numbersSubtitle}
      </Typography>

      <MetaNumbersLinkShared labels={t} />

      <AccountsListMobile
        labels={t}
        accounts={props.accounts}
        localDeactivatingId={props.localDeactivatingId}
        syncingId={props.syncingId}
        updatingId={props.updatingId}
        editingTokenForId={props.editingTokenForId}
        editingPinForId={props.editingPinForId}
        onMenuOpen={credMenu.handleMenuOpen}
        onAddAccount={props.onOpenCreateDialog}
        onRetrySetup={props.esConfigId && props.esAppId ? openEmbeddedSignup : undefined}
        manageRecipientsLabel={t.manageRecipients}
        onOpenManageRecipients={props.onOpenManageRecipients}
      />

      <AccountActionMenuMobile
        labels={t}
        anchorEl={credMenu.menuAnchorEl}
        onClose={credMenu.handleMenuClose}
        onEditName={handlers.handleEditNameFromMenu}
        onEditToken={handlers.handleEditTokenFromMenu}
        onEditPin={handlers.handleEditPinFromMenu}
        onLocalDeactivate={handlers.handleLocalDeactivateFromMenu}
      />

      <NumbersTabDialogsMobile
        props={props}
        credDialogOpen={credMenu.credDialogOpen}
        credDialogState={credMenu.credDialogState}
        credValidate={handlers.credValidate}
        credLoading={handlers.credLoading}
        handleCredDialogClose={credMenu.handleCredDialogClose}
        handleCredDialogConfirm={credMenu.handleCredDialogConfirm}
        handleLocalDeactivateConfirm={handlers.handleLocalDeactivateConfirm}
      />
    </Box>
  );
}

/**
 * Mobile numbers tab with full CRUD: add, edit name, edit token, edit PIN,
 * locally deactivate, and sync. Uses per-card action menu (MoreVert → Menu) for all
 * account actions. All dialogs are fullScreen on mobile for optimal UX.
 */
export function NumbersTabMobile(props: Readonly<NumbersTabSharedProps>) {
  const credMenu = useMobileCredMenuState(props.onSetAccessToken, props.onSetTwoStepPin);
  const handlers = useNumbersMenuHandlers(props, credMenu);

  if (props.loading) {
    return (
      <Box component="output" sx={{ p: 2 }} aria-busy>
        <Stack spacing={1.5}>
          <SkeletonAccountCard />
          <SkeletonAccountCard />
        </Stack>
      </Box>
    );
  }

  return <NumbersTabMobileBody props={props} credMenu={credMenu} handlers={handlers} />;
}

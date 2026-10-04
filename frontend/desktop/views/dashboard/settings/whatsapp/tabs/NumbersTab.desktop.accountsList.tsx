"use client";

import { AddOutlined, BlockOutlined, CloudSyncOutlined, MoreVertOutlined } from "@mui/icons-material";
import { Box, CircularProgress, IconButton, LinearProgress, Stack, Tooltip } from "@mui/material";
import { PrimaryPageAction } from "@/frontend/common/components/ui";
import {
  NumbersEmptyStateShared,
  NumbersListItemTransition,
} from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/__shared__";
import { NumberCard } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/NumberCard";
import { syncPulseSx } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/whatsappAnimations";
import type { WhatsappAccountRow } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import {
  AccountIdFields,
  ManageRecipientsAction,
} from "@/frontend/desktop/views/dashboard/settings/whatsapp/tabs/NumbersTab.desktop.cardFields";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

interface AccountsListItemProps {
  readonly labels: WhatsappLabels;
  readonly account: WhatsappAccountRow;
  readonly isLocalDeactivating: boolean;
  readonly isSyncing: boolean;
  /** Re-opens Embedded Signup from the failed-sync card panel (ES-gated). */
  readonly onRetrySetup?: () => void;
  /** Aria/tooltip label of the recipients manage affordance (conversations namespace). */
  readonly manageRecipientsLabel?: string;
  readonly onMenuOpen: (event: React.MouseEvent<HTMLElement>, account: WhatsappAccountRow) => void;
  readonly onLocalDeactivateConfirmDialog: (accountId: string, displayName: string) => void;
  readonly onOpenManageRecipients: (accountId: string) => void;
}

function AccountsListItem({
  labels,
  account,
  isLocalDeactivating,
  isSyncing,
  onRetrySetup,
  manageRecipientsLabel,
  onMenuOpen,
  onLocalDeactivateConfirmDialog,
  onOpenManageRecipients,
}: Readonly<AccountsListItemProps>) {
  const accountLabel = account.displayName?.en ?? account.displayPhoneNumber ?? account.id ?? "";
  return (
    <NumbersListItemTransition visible={!isLocalDeactivating} ariaBusy={isLocalDeactivating}>
      {isLocalDeactivating ? (
        <LinearProgress sx={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 1 }} />
      ) : null}
      <NumberCard
        account={account}
        labels={labels}
        onRetrySetup={onRetrySetup}
        syncDeadlineAt={account.syncDeadlineAt}
        syncFailureReason={account.syncFailureReason}
        action={
          <Box>
            <ManageRecipientsAction
              account={account}
              label={manageRecipientsLabel}
              disabled={isLocalDeactivating || isSyncing}
              onOpen={onOpenManageRecipients}
            />
            <IconButton
              aria-label={labels.editAccount}
              disabled={isLocalDeactivating || isSyncing}
              onClick={e => onMenuOpen(e, account)}
            >
              {isLocalDeactivating ? <CircularProgress size={20} /> : <MoreVertOutlined />}
            </IconButton>
            <Tooltip title={labels.localDeactivateAccountTooltip}>
              <IconButton
                aria-label={labels.localDeactivateAccount}
                color="error"
                disabled={isLocalDeactivating || isSyncing}
                onClick={() => {
                  if (account.id) {
                    onLocalDeactivateConfirmDialog(account.id, accountLabel);
                  }
                }}
              >
                {isLocalDeactivating ? <CircularProgress size={20} /> : <BlockOutlined />}
              </IconButton>
            </Tooltip>
            {isSyncing ? (
              <Box component="span" sx={{ display: "inline-flex", ml: 0.5, alignItems: "center" }}>
                <CloudSyncOutlined sx={syncPulseSx} />
              </Box>
            ) : null}
          </Box>
        }
        extraMetadata={<AccountIdFields labels={labels} account={account} />}
      />
    </NumbersListItemTransition>
  );
}

export function AccountsListSection({
  labels,
  accounts,
  localDeactivatingId,
  syncingId,
  onMenuOpen,
  onLocalDeactivateConfirmDialog,
  onAddAccount,
  onRetrySetup,
  manageRecipientsLabel,
  onOpenManageRecipients,
}: Readonly<{
  readonly labels: WhatsappLabels;
  readonly accounts: ReadonlyArray<WhatsappAccountRow>;
  readonly localDeactivatingId: string | null;
  readonly syncingId: string | null;
  readonly onMenuOpen: (event: React.MouseEvent<HTMLElement>, account: WhatsappAccountRow) => void;
  readonly onLocalDeactivateConfirmDialog: (accountId: string, displayName: string) => void;
  readonly onAddAccount: () => void;
  /** Re-opens Embedded Signup from the failed-sync card panel (ES-gated). */
  readonly onRetrySetup?: () => void;
  /** Aria/tooltip label of the recipients manage affordance (conversations namespace). */
  readonly manageRecipientsLabel?: string;
  /** Opens the recipients manage dialog for a test-number account. */
  readonly onOpenManageRecipients: (accountId: string) => void;
}>) {
  if (accounts.length === 0) {
    return (
      <NumbersEmptyStateShared
        labels={labels}
        cta={
          <PrimaryPageAction startIcon={<AddOutlined />} onClick={onAddAccount}>
            {labels.addFirstNumber}
          </PrimaryPageAction>
        }
      />
    );
  }

  return (
    <Stack spacing={2}>
      {accounts.map((account, index) => (
        <AccountsListItem
          key={account.id ?? account.phoneNumberId ?? index}
          labels={labels}
          account={account}
          isLocalDeactivating={localDeactivatingId === account.id}
          isSyncing={syncingId !== null}
          onRetrySetup={onRetrySetup}
          manageRecipientsLabel={manageRecipientsLabel}
          onMenuOpen={onMenuOpen}
          onLocalDeactivateConfirmDialog={onLocalDeactivateConfirmDialog}
          onOpenManageRecipients={onOpenManageRecipients}
        />
      ))}
    </Stack>
  );
}

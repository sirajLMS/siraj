"use client";

import { CloudSyncOutlined, MoreVertOutlined } from "@mui/icons-material";
import { Box, CircularProgress, IconButton, LinearProgress } from "@mui/material";
import { NumbersListItemTransition } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/__shared__";
import { NumberCardContent } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/NumberCardContent";
import { syncPulseSx } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/whatsappAnimations";
import type { WhatsappAccountRow } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import { MobileCardListItem } from "@/frontend/mobile/components/ui";
import { ManageRecipientsMobileAction } from "@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/NumbersTab.mobile.cardParts";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

export function AccountsListMobileItem({
  account,
  labels,
  isLocalDeactivating,
  isSyncing,
  isBusy,
  onMenuOpen,
  onRetrySetup,
  manageRecipientsLabel,
  onOpenManageRecipients,
}: Readonly<{
  readonly account: WhatsappAccountRow;
  readonly labels: WhatsappLabels;
  readonly isLocalDeactivating: boolean;
  readonly isSyncing: boolean;
  readonly isBusy: boolean;
  readonly onMenuOpen: (event: React.MouseEvent<HTMLElement>, account: WhatsappAccountRow) => void;
  readonly onRetrySetup?: () => void;
  readonly manageRecipientsLabel?: string;
  readonly onOpenManageRecipients: (accountId: string) => void;
}>) {
  return (
    <NumbersListItemTransition visible={!isLocalDeactivating} ariaBusy={isBusy}>
      <MobileCardListItem variant="rounded">
        {isBusy ? <LinearProgress sx={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 1 }} /> : null}
        <NumberCardContent
          account={account}
          labels={labels}
          onRetrySetup={onRetrySetup}
          syncDeadlineAt={account.syncDeadlineAt}
          syncFailureReason={account.syncFailureReason}
          action={
            <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
              <ManageRecipientsMobileAction
                account={account}
                label={manageRecipientsLabel}
                disabled={isBusy || isSyncing}
                onOpen={onOpenManageRecipients}
              />
              <IconButton
                size="small"
                aria-label={labels.editAccount}
                disabled={isBusy || isSyncing || !account.id}
                onClick={e => onMenuOpen(e, account)}
              >
                {isBusy ? <CircularProgress size={18} /> : <MoreVertOutlined />}
              </IconButton>
              {isSyncing ? (
                <Box component="span" sx={{ display: "inline-flex", alignItems: "center" }}>
                  <CloudSyncOutlined sx={syncPulseSx} fontSize="small" />
                </Box>
              ) : null}
            </Box>
          }
        />
      </MobileCardListItem>
    </NumbersListItemTransition>
  );
}

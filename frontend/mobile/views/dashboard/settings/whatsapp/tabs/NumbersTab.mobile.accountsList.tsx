"use client";

import { AddOutlined } from "@mui/icons-material";
import { useCallback } from "react";
import { NumbersEmptyStateShared } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/__shared__";
import type { WhatsappAccountRow } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import { MobilePrimaryPageAction } from "@/frontend/mobile/components/ui";
import { MobileCardList } from "@/frontend/mobile/components/ui/container/MobileCardList";
import { AccountsListMobileItem } from "@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/NumbersTab.mobile.accountsListItem";
import { isCardBusy } from "@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/NumbersTab.mobile.helpers";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

interface AccountsListMobileProps {
  readonly labels: WhatsappLabels;
  readonly accounts: ReadonlyArray<WhatsappAccountRow>;
  readonly localDeactivatingId: string | null;
  readonly syncingId: string | null;
  readonly updatingId: string | null;
  readonly editingTokenForId: string | null;
  readonly editingPinForId: string | null;
  readonly onMenuOpen: (event: React.MouseEvent<HTMLElement>, account: WhatsappAccountRow) => void;
  readonly onAddAccount: () => void;
  /** Re-opens Embedded Signup from the failed-sync card panel (ES-gated). */
  readonly onRetrySetup?: () => void;
  /** Aria label of the recipients manage affordance (conversations namespace). */
  readonly manageRecipientsLabel?: string;
  /** Opens the recipients manage dialog for a test-number account. */
  readonly onOpenManageRecipients: (accountId: string) => void;
}

export function AccountsListMobile({
  labels,
  accounts,
  localDeactivatingId,
  syncingId,
  updatingId,
  editingTokenForId,
  editingPinForId,
  onMenuOpen,
  onAddAccount,
  onRetrySetup,
  manageRecipientsLabel,
  onOpenManageRecipients,
}: Readonly<AccountsListMobileProps>) {
  const renderItem = useCallback(
    (account: WhatsappAccountRow) => {
      const isLocalDeactivating = localDeactivatingId === account.id;
      const isSyncing = syncingId !== null;
      const isBusy = isCardBusy(account.id, localDeactivatingId, updatingId, editingTokenForId, editingPinForId);
      return (
        <AccountsListMobileItem
          account={account}
          labels={labels}
          isLocalDeactivating={isLocalDeactivating}
          isSyncing={isSyncing}
          isBusy={isBusy}
          onMenuOpen={onMenuOpen}
          onRetrySetup={onRetrySetup}
          manageRecipientsLabel={manageRecipientsLabel}
          onOpenManageRecipients={onOpenManageRecipients}
        />
      );
    },
    [
      localDeactivatingId,
      syncingId,
      updatingId,
      editingTokenForId,
      editingPinForId,
      labels,
      onMenuOpen,
      onRetrySetup,
      manageRecipientsLabel,
      onOpenManageRecipients,
    ]
  );

  const renderEmptyState = useCallback(
    () => (
      <NumbersEmptyStateShared
        labels={labels}
        cta={
          <MobilePrimaryPageAction startIcon={<AddOutlined />} onClick={onAddAccount}>
            {labels.addFirstNumber}
          </MobilePrimaryPageAction>
        }
      />
    ),
    [labels, onAddAccount]
  );

  return (
    <MobileCardList
      rows={accounts}
      renderItem={renderItem}
      getKey={account => account.id ?? account.phoneNumberId ?? account.displayPhoneNumber ?? ""}
      emptyMessage={labels.noAccounts}
      renderEmptyState={renderEmptyState}
      paginationOptions={{ mode: "client", pageSize: 10 }}
      gap={1.5}
      layout="rounded"
    />
  );
}

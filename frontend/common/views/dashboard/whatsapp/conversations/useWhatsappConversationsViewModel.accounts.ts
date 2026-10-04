"use client";

import { useCallback, useEffect, useMemo } from "react";
import { AppPermission, type WhatsappAccountsQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { buildAccountOptions } from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.helpers";
import type {
  ComposerState,
  ConversationsFiltersState,
  RecipientDialogsState,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.state";

interface ConversationsAccountsParams {
  readonly accountsQuery: { readonly data: WhatsappAccountsQuery | undefined; readonly loading: boolean };
  readonly filters: ConversationsFiltersState;
  readonly composer: ComposerState;
  readonly dialogs: RecipientDialogsState;
  readonly locale: string;
}

/** Account picking: options, selection defaulting/re-anchoring, and lookup helpers. */
export function useConversationsAccountsStack({
  accountsQuery,
  filters,
  composer,
  dialogs,
  locale,
}: Readonly<ConversationsAccountsParams>) {
  const accounts = useMemo(
    () => buildAccountOptions(accountsQuery.data?.whatsappAccounts ?? null, locale),
    [accountsQuery.data, locale]
  );

  const hasPermission = useUserStore(state => state.hasPermission);
  const canManage = hasPermission(AppPermission.WhatsappConversationsManage);

  const selectedAccount = useMemo(
    () => accounts.find(option => option.id === filters.accountId) ?? null,
    [accounts, filters.accountId]
  );

  const resetComposer = composer.resetComposer;
  const clearNotice = dialogs.setNotice;
  /** Composer + registry notice reset performed whenever the number changes. */
  const resetForAccountSwitch = useCallback(() => {
    resetComposer();
    clearNotice(null);
  }, [resetComposer, clearNotice]);

  const baseOnAccountChange = filters.onAccountChange;
  const onAccountChange = useCallback(
    (nextAccountId: string) => {
      baseOnAccountChange(nextAccountId);
      resetForAccountSwitch();
    },
    [baseOnAccountChange, resetForAccountSwitch]
  );

  // Default to the first connected number once accounts resolve; re-anchor if
  // the selected number disappears from the list (sync/deactivation).
  const selectAccount = filters.setAccountId;
  useEffect(() => {
    const first = accounts[0];
    if (first && (filters.accountId === null || !accounts.some(o => o.id === filters.accountId))) {
      if (filters.accountId !== null) {
        resetForAccountSwitch();
      }
      selectAccount(first.id);
    }
  }, [accounts, filters.accountId, selectAccount, resetForAccountSwitch]);

  const isTestAccount = selectedAccount?.isTestNumber ?? false;

  const accountLabel = useCallback(
    (accountId: string | null) => accounts.find(option => option.id === accountId)?.label ?? null,
    [accounts]
  );
  const accountIsTestNumber = useCallback(
    (accountId: string | null) => accounts.find(option => option.id === accountId)?.isTestNumber ?? false,
    [accounts]
  );

  return {
    accounts,
    accountsLoading: accountsQuery.loading,
    accountId: filters.accountId,
    selectedAccount,
    onAccountChange,
    canManage,
    isTestAccount,
    accountLabel,
    accountIsTestNumber,
  };
}

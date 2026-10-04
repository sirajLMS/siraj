import { useCallback, useMemo } from "react";
import {
  MeetingIntegrationConnectedAccountStatus,
  type MeetingIntegrationProviderSlug,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { useMeetingIntegrationsSettingsStore } from "@/frontend/common/stores/meetingIntegrationsSettingsStore";
import { getProviderLabel } from "@/frontend/common/views/dashboard/settings/tabs/meetingIntegrations/__shared__/meetingIntegrationsTabShared.helpers";
import type {
  ConnectedAccountsTableProps,
  MeetingIntegrationConnectedAccount,
  MeetingIntegrationProviderSlug as ProviderSlugType,
} from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

export function getStatusLabel(
  status: MeetingIntegrationConnectedAccountStatus,
  labels: SettingsMeetingIntegrationsLabels
): string {
  switch (status) {
    case MeetingIntegrationConnectedAccountStatus.Connected:
      return labels.status.connected;
    case MeetingIntegrationConnectedAccountStatus.ExpiringSoon:
      return labels.status.expiringSoon;
    case MeetingIntegrationConnectedAccountStatus.ReauthNeeded:
      return labels.status.reauthNeeded;
    case MeetingIntegrationConnectedAccountStatus.Revoked:
      return labels.status.revoked;
    default:
      return String(status);
  }
}

export function formatConnectedAccountDate(date: Date | null | undefined): string {
  return date ? date.toLocaleDateString() : "—";
}

export function isMeetingIntegrationConnectedAccount(value: unknown): value is MeetingIntegrationConnectedAccount {
  return typeof value === "object" && value !== null && "userId" in value;
}

export function isRevokeDisabled(
  account: MeetingIntegrationConnectedAccount,
  revokingFor: ConnectedAccountsTableProps["revokingFor"],
  providerSlug: ProviderSlugType
): boolean {
  return revokingFor?.userId === account.userId && revokingFor?.providerSlug === providerSlug;
}

function filterConnectedAccounts(
  accounts: readonly MeetingIntegrationConnectedAccount[],
  search: string,
  statusFilter: MeetingIntegrationConnectedAccountStatus | "all"
): readonly MeetingIntegrationConnectedAccount[] {
  const lowerSearch = search.trim().toLowerCase();
  return accounts.filter(account => {
    if (statusFilter !== "all" && account.status !== statusFilter) {
      return false;
    }
    if (lowerSearch.length === 0) {
      return true;
    }
    const nameMatch = (account.name ?? "").toLowerCase().includes(lowerSearch);
    const emailMatch = (account.email ?? "").toLowerCase().includes(lowerSearch);
    return nameMatch || emailMatch;
  });
}

export function useConnectedAccountsFilter(
  accounts: readonly MeetingIntegrationConnectedAccount[],
  providerSlug: MeetingIntegrationProviderSlug,
  labels: SettingsMeetingIntegrationsLabels
) {
  // Filter state lives in the settings store (keyed per provider) so it
  // survives the component unmount/remount caused by viewport tier switches.
  const search = useMeetingIntegrationsSettingsStore(
    state => state.connectedAccountsSearchByProvider[providerSlug] ?? ""
  );
  const statusFilter = useMeetingIntegrationsSettingsStore(
    state => state.connectedAccountsStatusFilterByProvider[providerSlug] ?? "all"
  );
  const setConnectedAccountsSearch = useMeetingIntegrationsSettingsStore(state => state.setConnectedAccountsSearch);
  const setConnectedAccountsStatusFilter = useMeetingIntegrationsSettingsStore(
    state => state.setConnectedAccountsStatusFilter
  );

  const setSearch = useCallback(
    (value: string) => {
      setConnectedAccountsSearch(providerSlug, value);
    },
    [providerSlug, setConnectedAccountsSearch]
  );
  const setStatusFilter = useCallback(
    (value: MeetingIntegrationConnectedAccountStatus | "all") => {
      setConnectedAccountsStatusFilter(providerSlug, value);
    },
    [providerSlug, setConnectedAccountsStatusFilter]
  );

  const providerName = useMemo(() => getProviderLabel(providerSlug, labels), [providerSlug, labels]);

  const filteredRows = useMemo(
    () => filterConnectedAccounts(accounts, search, statusFilter),
    [accounts, search, statusFilter]
  );

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    providerName,
    filteredRows,
  };
}

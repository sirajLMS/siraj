"use client";

import { useNotifications } from "@toolpad/core/useNotifications";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { useMeetingIntegrationProvidersQuery } from "@/frontend/common/hooks/settings";
import { MEETING_INTEGRATIONS_PROFILE_LINK_PERMISSION } from "@/frontend/common/stores/meetingIntegrationsSettingsStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { useMeetingIntegrationsActions } from "@/frontend/common/views/dashboard/settings/tabs/meetingIntegrations/useMeetingIntegrationsActions";
import { mapProviderSummary } from "@/frontend/common/views/dashboard/settings/tabs/meetingIntegrations/useMeetingIntegrationsViewModel.helpers";
import {
  useConnectedAccountsSync,
  useMeetingIntegrationsStoreValues,
} from "@/frontend/common/views/dashboard/settings/tabs/meetingIntegrations/useMeetingIntegrationsViewModel.hooks";
import type { MeetingIntegrationsViewModel } from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import { Translation, useAppLocale, useAppTranslation } from "@/shared/locale";

export function useMeetingIntegrationsViewModel(): MeetingIntegrationsViewModel {
  const router = useRouter();
  const labels = useAppTranslation(Translation.Dashboard.SettingsMeetingIntegrations);
  const locale = useAppLocale();
  const notifications = useNotifications();
  const hasPermission = useUserStore(state => state.hasPermission);
  const canEdit = hasPermission(AppPermission.SettingsEditMeetingIntegrations);

  const store = useMeetingIntegrationsStoreValues();
  const { data, loading, error, refetch } = useMeetingIntegrationProvidersQuery();
  const providers = useMemo(() => {
    const seen = new Set<string>();
    return (data?.meetingIntegrationProviders ?? [])
      .filter(provider => {
        if (provider.slug == null || seen.has(provider.slug)) {
          return false;
        }
        seen.add(provider.slug);
        return true;
      })
      .map(mapProviderSummary);
  }, [data]);

  useConnectedAccountsSync(store.expandedSlug, store);

  useEffect(() => {
    const permitted = hasPermission(MEETING_INTEGRATIONS_PROFILE_LINK_PERMISSION);
    if (store.canViewProfile !== permitted) {
      store.setCanViewProfile(permitted);
    }
  }, [hasPermission, store]);

  const actions = useMeetingIntegrationsActions({ store, notifications, labels, refetch, router });

  return {
    labels,
    locale,
    loading,
    error: error ?? undefined,
    canEdit,
    providers,
    expandedSlug: store.expandedSlug,
    onExpandedSlugChange: store.setExpandedSlug,
    connectedAccountsByProvider: store.connectedAccountsByProvider,
    loadingAccountsFor: store.loadingAccountsFor,
    testingFor: store.testingFor,
    lastTestResultByProvider: store.lastTestResultByProvider,
    revokingFor: store.revokingFor,
    metadataDialogAccount: store.metadataDialogAccount,
    metadataDialogProviderSlug: store.metadataDialogProviderSlug,
    runTest: actions.runTest,
    revokeAccount: actions.revokeAccount,
    onMetadataDialogOpen: actions.onMetadataDialogOpen,
    onMetadataDialogClose: actions.onMetadataDialogClose,
    connectingFor: store.connectingProviderSlug,
    connectErrorFor: store.connectErrorFor,
    connectProvider: actions.connectProvider,
    navigateToProfile: actions.navigateToProfile,
    canViewProfile: store.canViewProfile,
    refresh: actions.refresh,
  };
}

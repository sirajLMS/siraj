import { useMutation } from "@apollo/client/react";
import type { useNotifications } from "@toolpad/core/useNotifications";
import type { useRouter } from "next/navigation";
import { useCallback } from "react";
import type { MeetingConnectionTestMode } from "@/frontend/common/graphql/generated/gql/graphql";
import { connectMeetingProviderOAuthMutationDocument } from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";
import {
  adminRevokeMeetingProviderTokenMutationDocument,
  testMeetingProviderConnectionMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/settings/meeting-integrations.documents";
import {
  buildConnectProvider,
  buildRevokeAccount,
  buildRunTest,
} from "@/frontend/common/views/dashboard/settings/tabs/meetingIntegrations/useMeetingIntegrationsViewModel.actions";
import type { UseMeetingIntegrationsStoreAccess } from "@/frontend/common/views/dashboard/settings/tabs/meetingIntegrations/useMeetingIntegrationsViewModel.hooks";
import type {
  MeetingIntegrationConnectedAccount,
  MeetingIntegrationProviderSlug as ViewModelProviderSlug,
} from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

interface UseMeetingIntegrationsActionsParams {
  readonly store: UseMeetingIntegrationsStoreAccess;
  readonly notifications: ReturnType<typeof useNotifications>;
  readonly labels: SettingsMeetingIntegrationsLabels;
  readonly refetch: () => Promise<unknown>;
  readonly router: ReturnType<typeof useRouter>;
}

export function useMeetingIntegrationsActions({
  store,
  notifications,
  labels,
  refetch,
  router,
}: UseMeetingIntegrationsActionsParams) {
  const [testConnection] = useMutation(testMeetingProviderConnectionMutationDocument);
  const [revokeToken] = useMutation(adminRevokeMeetingProviderTokenMutationDocument);
  const [connectOAuth] = useMutation(connectMeetingProviderOAuthMutationDocument);

  const runTest = useCallback(
    (providerSlug: ViewModelProviderSlug, mode: MeetingConnectionTestMode) =>
      buildRunTest({ testConnection, notifications, labels }, store)(providerSlug, mode),
    [testConnection, notifications, labels, store]
  );

  const revokeAccount = useCallback(
    (userId: string, providerSlug: ViewModelProviderSlug) =>
      buildRevokeAccount({ revokeToken, notifications, labels, refetch }, store)(userId, providerSlug),
    [revokeToken, notifications, labels, refetch, store]
  );

  const onMetadataDialogOpen = useCallback(
    (account: MeetingIntegrationConnectedAccount, providerSlug: ViewModelProviderSlug) => {
      store.setMetadataDialogAccount(account);
      store.setMetadataDialogProviderSlug(providerSlug);
    },
    [store]
  );

  const onMetadataDialogClose = useCallback(() => {
    store.setMetadataDialogAccount(null);
    store.setMetadataDialogProviderSlug(null);
  }, [store]);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const connectProvider = useCallback(
    (providerSlug: ViewModelProviderSlug) =>
      buildConnectProvider({ connectOAuth, notifications, labels }, store)(providerSlug),
    [connectOAuth, notifications, labels, store]
  );

  const navigateToProfile = useCallback(() => {
    router.push("/profile?tab=meeting");
  }, [router]);

  return {
    runTest,
    revokeAccount,
    onMetadataDialogOpen,
    onMetadataDialogClose,
    refresh,
    connectProvider,
    navigateToProfile,
  };
}

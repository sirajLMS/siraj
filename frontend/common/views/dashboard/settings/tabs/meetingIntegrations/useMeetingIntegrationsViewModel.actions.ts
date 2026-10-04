import type { useMutation } from "@apollo/client/react";
import type { useNotifications } from "@toolpad/core/useNotifications";
import type { MeetingConnectionTestMode } from "@/frontend/common/graphql/generated/gql/graphql";
import { logger } from "@/frontend/common/utils/logger";
import { mapTestResult } from "@/frontend/common/views/dashboard/settings/tabs/meetingIntegrations/useMeetingIntegrationsViewModel.helpers";
import type { UseMeetingIntegrationsStoreAccess } from "@/frontend/common/views/dashboard/settings/tabs/meetingIntegrations/useMeetingIntegrationsViewModel.hooks";
import type { MeetingIntegrationProviderSlug as ViewModelProviderSlug } from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

interface ConnectProviderDeps {
  connectOAuth: ReturnType<typeof useMutation>[0];
  notifications: ReturnType<typeof useNotifications>;
  labels: SettingsMeetingIntegrationsLabels;
}

export function buildConnectProvider(
  deps: ConnectProviderDeps,
  store: Pick<UseMeetingIntegrationsStoreAccess, "setConnectingProviderSlug" | "setConnectErrorFor">
) {
  const { connectOAuth, notifications, labels } = deps;

  return async (providerSlug: ViewModelProviderSlug) => {
    store.setConnectingProviderSlug(providerSlug);
    store.setConnectErrorFor(providerSlug, null);

    try {
      const returnPath = globalThis.window?.location?.pathname ?? "/";
      const { data } = await connectOAuth({
        variables: {
          input: {
            providerSlug,
            returnPath,
          },
        },
      });

      const authorizeUrl = data?.connectMeetingProviderOAuth?.authorizeUrl;
      if (authorizeUrl && globalThis.window) {
        globalThis.window.location.href = authorizeUrl;
        return;
      }

      // No authorizeUrl returned — treat as an error.
      const errorMsg = labels.connectProviderError;
      store.setConnectErrorFor(providerSlug, errorMsg);
      notifications.show(errorMsg, { severity: "error" });
    } catch (connectError) {
      logger.error("Failed to connect meeting provider OAuth", { providerSlug, error: connectError });
      const errorMsg = labels.connectProviderError;
      store.setConnectErrorFor(providerSlug, errorMsg);
      notifications.show(errorMsg, { severity: "error" });
    } finally {
      store.setConnectingProviderSlug(null);
    }
  };
}

interface RunTestDeps {
  testConnection: ReturnType<typeof useMutation>[0];
  notifications: ReturnType<typeof useNotifications>;
  labels: SettingsMeetingIntegrationsLabels;
}

export function buildRunTest(
  deps: RunTestDeps,
  store: Pick<UseMeetingIntegrationsStoreAccess, "setTestingFor" | "setLastTestResult">
) {
  const { testConnection, notifications, labels } = deps;

  return async (providerSlug: ViewModelProviderSlug, mode: MeetingConnectionTestMode) => {
    store.setTestingFor(providerSlug);

    try {
      const { data: testData } = await testConnection({
        variables: {
          input: {
            providerSlug,
            mode,
          },
        },
      });

      const result = mapTestResult(testData?.testMeetingProviderConnection);
      store.setLastTestResult(providerSlug, result);

      if (result?.ok) {
        notifications.show(labels.notifications.testSuccess, { severity: "success" });
      } else {
        notifications.show(labels.notifications.testError, { severity: "error" });
      }
    } catch (testError) {
      logger.error("Failed to test meeting provider connection", { providerSlug, error: testError });
      store.setLastTestResult(providerSlug, {
        ok: false,
        latencyMs: 0,
        mode,
        testJoinUrl: null,
        deleted: null,
        upstreamResponseSummary: "",
        errorCode: "TEST_FAILED",
        errorMessage: testError instanceof Error ? testError.message : String(testError),
        rawUpstreamPayload: null,
        requiredScopes: null,
        grantedScopes: null,
      });
      notifications.show(labels.notifications.testError, { severity: "error" });
    } finally {
      store.setTestingFor(null);
    }
  };
}

interface RevokeAccountDeps {
  revokeToken: ReturnType<typeof useMutation>[0];
  notifications: ReturnType<typeof useNotifications>;
  labels: SettingsMeetingIntegrationsLabels;
  refetch: () => Promise<unknown>;
}

export function buildRevokeAccount(
  deps: RevokeAccountDeps,
  store: Pick<UseMeetingIntegrationsStoreAccess, "setRevokingFor">
) {
  const { revokeToken, notifications, labels, refetch } = deps;

  return async (userId: string, providerSlug: ViewModelProviderSlug) => {
    store.setRevokingFor({ userId, providerSlug });

    try {
      await revokeToken({
        variables: {
          input: {
            providerSlug,
            userId,
          },
        },
      });
      await refetch();
      notifications.show(labels.notifications.revokeSuccess, { severity: "success" });
    } catch (revokeError) {
      logger.error("Failed to revoke meeting provider token", { userId, providerSlug, error: revokeError });
      notifications.show(labels.notifications.revokeError, { severity: "error" });
    } finally {
      store.setRevokingFor(null);
    }
  };
}

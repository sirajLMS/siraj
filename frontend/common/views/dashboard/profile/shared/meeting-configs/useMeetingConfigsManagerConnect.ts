"use client";

import { useMutation } from "@apollo/client/react";
import { useCallback, useState } from "react";
import {
  connectMeetingProviderOAuthMutationDocument,
  disconnectMeetingProviderOAuthMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";
import { logger } from "@/frontend/common/utils/logger";
import { isMeetingIntegrationProviderSlug } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigsManager.helpers";

interface AuthorizeUrlArgs {
  readonly addConnectingSlug: (slug: string) => void;
  readonly removeConnectingSlug: (slug: string) => void;
  readonly removeReactiveSlug: (slug: string) => void;
}

/** Requests OAuth authorize URLs for providers and tracks the per-provider
 *  reconnecting flag shown by the manager UI. */
export function useMeetingConfigsManagerAuthorizeUrl({
  addConnectingSlug,
  removeConnectingSlug,
  removeReactiveSlug,
}: AuthorizeUrlArgs) {
  const [reconnectingFor, setReconnectingFor] = useState<string | null>(null);
  const [connectMeetingProviderOAuth] = useMutation(connectMeetingProviderOAuthMutationDocument);

  /** Returns the provider's OAuth authorize URL, or `null` when the slug is
   *  unknown or the mutation fails. A successful URL also clears the
   *  provider's reactive reauth flag. */
  const requestOAuthAuthorizeUrl = useCallback(
    async (providerSlug: string): Promise<string | null> => {
      if (!isMeetingIntegrationProviderSlug(providerSlug)) return null;
      addConnectingSlug(providerSlug);
      setReconnectingFor(providerSlug);
      try {
        const result = await connectMeetingProviderOAuth({
          variables: {
            input: {
              providerSlug,
              returnPath: globalThis.window?.location?.pathname ?? "/",
            },
          },
        });
        const authorizeUrl = result.data?.connectMeetingProviderOAuth?.authorizeUrl ?? null;
        if (authorizeUrl) {
          removeReactiveSlug(providerSlug);
          return authorizeUrl;
        }
        removeConnectingSlug(providerSlug);
        return null;
      } catch (caughtError) {
        removeConnectingSlug(providerSlug);
        logger.error(`OAuth connect failed for provider ${providerSlug}:`, caughtError);
        return null;
      } finally {
        setReconnectingFor(null);
      }
    },
    [connectMeetingProviderOAuth, addConnectingSlug, removeConnectingSlug, removeReactiveSlug]
  );

  return { view: { reconnectingFor }, requestOAuthAuthorizeUrl };
}

interface ConnectFlowArgs {
  readonly refetch: () => Promise<unknown>;
  readonly connectedProvidersQueryRefetch: () => Promise<unknown>;
  readonly requestOAuthAuthorizeUrl: (providerSlug: string) => Promise<string | null>;
  readonly removeReactiveSlug: (slug: string) => void;
  readonly setErrorMessage: (message: string | null) => void;
  readonly saveErrorLabel: string;
  readonly clearProviderBookingsCache: (providerSlug: string) => void;
  readonly collapseExpandedForProvider: (providerSlug: string) => void;
}

/** Owns the redirecting reconnect/disconnect row actions and the
 *  disconnecting flag. Both actions clear the provider's cached bookings and
 *  collapse its expanded bookings view so stale data is re-fetched. */
export function useMeetingConfigsManagerConnect({
  refetch,
  connectedProvidersQueryRefetch,
  requestOAuthAuthorizeUrl,
  removeReactiveSlug,
  setErrorMessage,
  saveErrorLabel,
  clearProviderBookingsCache,
  collapseExpandedForProvider,
}: ConnectFlowArgs) {
  const [disconnectMeetingProviderOAuth, { loading: disconnecting }] = useMutation(
    disconnectMeetingProviderOAuthMutationDocument
  );

  const handleReconnect = async (providerSlug: string) => {
    const authorizeUrl = await requestOAuthAuthorizeUrl(providerSlug);
    if (authorizeUrl) {
      if (globalThis.window) {
        globalThis.window.location.href = authorizeUrl;
      }
      return;
    }
    setErrorMessage(saveErrorLabel);
    clearProviderBookingsCache(providerSlug);
    collapseExpandedForProvider(providerSlug);
  };

  const disconnectProvider = async (providerSlug: string) => {
    if (!isMeetingIntegrationProviderSlug(providerSlug)) return;
    setErrorMessage(null);
    try {
      await disconnectMeetingProviderOAuth({
        variables: {
          input: {
            providerSlug,
          },
        },
      });
      removeReactiveSlug(providerSlug);
      await Promise.all([refetch(), connectedProvidersQueryRefetch()]);
    } catch (caughtError) {
      logger.error("disconnectProvider OAuth failed", caughtError);
      setErrorMessage(saveErrorLabel);
    }
    clearProviderBookingsCache(providerSlug);
    collapseExpandedForProvider(providerSlug);
  };

  return {
    view: { onReconnect: handleReconnect, connectProvider: handleReconnect, disconnectProvider, disconnecting },
  };
}

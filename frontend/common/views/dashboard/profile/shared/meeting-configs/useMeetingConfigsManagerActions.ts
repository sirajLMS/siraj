"use client";

import type { useNotifications } from "@toolpad/core/useNotifications";
import type { useMeetingConfigsManagerBookings } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigsManagerBookings";
import { useMeetingConfigsManagerCallback } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigsManagerCallback";
import {
  useMeetingConfigsManagerAuthorizeUrl,
  useMeetingConfigsManagerConnect,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigsManagerConnect";
import type { useMeetingConfigsManagerConnectAccounts } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigsManagerConnectAccounts";
import type { useMeetingConfigsManagerDialogs } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigsManagerDialogs";
import type { useMeetingConfigsManagerReauth } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigsManagerReauth";
import { useMeetingConfigsManagerReconnectAll } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigsManagerReconnectAll";
import type { MeetingConfigEnhancementLabels } from "@/shared/locale/types/ui";

interface ActionsArgs {
  readonly refetch: () => Promise<unknown>;
  readonly connectedProvidersQueryRefetch: () => Promise<unknown>;
  readonly saveErrorLabel: string;
  readonly notifications: ReturnType<typeof useNotifications>;
  readonly enhancements: Pick<
    MeetingConfigEnhancementLabels,
    | "oauthCallbackSuccess"
    | "oauthCallbackError"
    | "urlCopied"
    | "urlCopyFailed"
    | "reconnectedProviders"
    | "reconnectFailedProviders"
  >;
  readonly reauth: ReturnType<typeof useMeetingConfigsManagerReauth>;
  readonly dialogs: ReturnType<typeof useMeetingConfigsManagerDialogs>;
  readonly connectAccounts: ReturnType<typeof useMeetingConfigsManagerConnectAccounts>;
  readonly bookings: ReturnType<typeof useMeetingConfigsManagerBookings>;
}

/** Composes the manager's OAuth action flows — authorize-URL requests,
 *  redirecting reconnect/disconnect, the reconnect-all batch, the OAuth
 *  callback side effects, and URL copying — into one view fragment. */
export function useMeetingConfigsManagerActions({
  refetch,
  connectedProvidersQueryRefetch,
  saveErrorLabel,
  notifications,
  enhancements,
  reauth,
  dialogs,
  connectAccounts,
  bookings,
}: ActionsArgs) {
  const authorizeUrl = useMeetingConfigsManagerAuthorizeUrl({
    addConnectingSlug: connectAccounts.addConnectingSlug,
    removeConnectingSlug: connectAccounts.removeConnectingSlug,
    removeReactiveSlug: reauth.removeReactiveSlug,
  });
  const connect = useMeetingConfigsManagerConnect({
    refetch,
    connectedProvidersQueryRefetch,
    requestOAuthAuthorizeUrl: authorizeUrl.requestOAuthAuthorizeUrl,
    removeReactiveSlug: reauth.removeReactiveSlug,
    setErrorMessage: dialogs.setErrorMessage,
    saveErrorLabel,
    clearProviderBookingsCache: bookings.clearProviderBookingsCache,
    collapseExpandedForProvider: bookings.collapseExpandedForProvider,
  });
  const reconnectAll = useMeetingConfigsManagerReconnectAll({
    requestOAuthAuthorizeUrl: authorizeUrl.requestOAuthAuthorizeUrl,
    notifications,
    enhancements,
  });
  const callback = useMeetingConfigsManagerCallback({
    connectedProvidersQueryRefetch,
    notifications,
    enhancements,
  });

  return {
    view: {
      ...authorizeUrl.view,
      ...connect.view,
      ...reconnectAll.view,
      ...callback.view,
    },
  };
}

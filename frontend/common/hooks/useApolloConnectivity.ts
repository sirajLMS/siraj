"use client";

import { useNotifications } from "@toolpad/core/useNotifications";
import {
  useConnectivityLifecycle,
  useConnectivityState,
  useDisconnectNotifier,
  useNetworkStatusListeners,
} from "@/frontend/common/hooks/useApolloConnectivity.hooks";
import { Translation, useAppTranslation } from "@/shared/locale";

export const useApolloConnectivity = () => {
  const notifications = useNotifications();
  const t = useAppTranslation(Translation.Common);

  const {
    isConnected,
    isChecking,
    lastChecked,
    initialCheckDone,
    isConnectedRef,
    reconnectAttemptRef,
    reconnectTimeoutRef,
    checkConnectivity,
    setConnected,
  } = useConnectivityState();

  const notifyIfDisconnected = useDisconnectNotifier({
    notifications,
    t,
    checkConnectivity,
    isConnectedRef,
    reconnectAttemptRef,
  });

  useConnectivityLifecycle({
    isConnected,
    initialCheckDone,
    checkConnectivity,
    reconnectAttemptRef,
    reconnectTimeoutRef,
  });

  useNetworkStatusListeners({ checkConnectivity, setConnected, notifyIfDisconnected });

  return {
    isConnected,
    isChecking,
    lastChecked,
    initialCheckDone,
    checkConnectivity,
    setConnected,
    notifyIfDisconnected,
    isConnectedRef,
  };
};

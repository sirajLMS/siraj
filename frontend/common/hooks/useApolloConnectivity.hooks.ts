"use client";

import type { useNotifications } from "@toolpad/core/useNotifications";
import { type RefObject, useCallback, useEffect, useRef, useState } from "react";
import {
  getReconnectionDelay,
  MIN_CHECK_INTERVAL,
  runConnectivityCheck,
} from "@/frontend/common/hooks/useApolloConnectivity.helpers";

type NotificationsApi = ReturnType<typeof useNotifications>;

type ConnectionMessages = {
  readonly serverConnectionLost: string;
  readonly checkNetworkConnection: string;
  readonly retry: string;
  readonly connectionRestored: string;
};

export type ApolloConnectivityState = {
  readonly isConnected: boolean;
  readonly isChecking: boolean;
  readonly lastChecked: Date | null;
  readonly initialCheckDone: boolean;
  readonly isConnectedRef: RefObject<boolean>;
  readonly reconnectAttemptRef: RefObject<number>;
  readonly reconnectTimeoutRef: RefObject<NodeJS.Timeout | null>;
  readonly checkConnectivity: () => Promise<boolean>;
  readonly setConnected: (connected: boolean) => void;
};

/**
 * Owns the connectivity state, refs, and probe callback for
 * `useApolloConnectivity`, plus the shared in-flight check guard.
 */
export function useConnectivityState(): ApolloConnectivityState {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  const isConnectedRef = useRef(false);
  const inFlightCheckRef = useRef<Promise<boolean> | null>(null);
  const lastCheckTimeRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptRef = useRef(0);

  const checkConnectivity = useCallback((): Promise<boolean> => {
    // Share an in-flight check instead of returning a premature `false`: the
    // Apollo connectivity link fires a page's first queries while the initial
    // HEAD check is still running, and returning the not-yet-updated
    // `isConnectedRef.current` (false) would make a healthy server look
    // offline — silently short-circuiting that first batch (e.g. the WhatsApp
    // numbers query) with a synthetic NETWORK_ERROR before it ever reaches
    // the server. Awaiting the same promise yields the real verdict instead.
    if (inFlightCheckRef.current) {
      return inFlightCheckRef.current;
    }

    const now = Date.now();
    if (now - lastCheckTimeRef.current < MIN_CHECK_INTERVAL) {
      return Promise.resolve(isConnectedRef.current);
    }
    lastCheckTimeRef.current = now;

    queueMicrotask(() => setIsChecking(true));

    const checkPromise = runConnectivityCheck({
      isConnectedRef,
      inFlightCheckRef,
      reconnectAttemptRef,
      setIsChecking,
      setIsConnected,
      setLastChecked,
      setInitialCheckDone,
    });

    inFlightCheckRef.current = checkPromise;
    return checkPromise;
  }, []);

  const setConnected = useCallback((connected: boolean) => {
    isConnectedRef.current = connected;
    queueMicrotask(() => setIsConnected(connected));
  }, []);

  return {
    isConnected,
    isChecking,
    lastChecked,
    initialCheckDone,
    isConnectedRef,
    reconnectAttemptRef,
    reconnectTimeoutRef,
    checkConnectivity,
    setConnected,
  };
}

type DisconnectNotifierContext = {
  readonly notifications: NotificationsApi;
  readonly t: ConnectionMessages;
  readonly checkConnectivity: () => Promise<boolean>;
  readonly isConnectedRef: RefObject<boolean>;
  readonly reconnectAttemptRef: RefObject<number>;
};

export function useDisconnectNotifier(context: DisconnectNotifierContext): () => void {
  const { notifications, t, checkConnectivity, isConnectedRef, reconnectAttemptRef } = context;

  return useCallback(() => {
    if (!isConnectedRef.current) {
      notifications.show(`${t.serverConnectionLost}. ${t.checkNetworkConnection}.`, {
        severity: "error",
        autoHideDuration: 5000,
        actionText: t.retry,
        onAction: () => {
          reconnectAttemptRef.current = 0;
          void checkConnectivity().then(connected => {
            if (connected) {
              notifications.show(t.connectionRestored, {
                severity: "success",
                autoHideDuration: 3000,
              });
            }
            return undefined;
          });
        },
      });
    }
  }, [notifications, t, checkConnectivity, isConnectedRef, reconnectAttemptRef]);
}

type ConnectivityLifecycleContext = {
  readonly isConnected: boolean;
  readonly initialCheckDone: boolean;
  readonly checkConnectivity: () => Promise<boolean>;
  readonly reconnectAttemptRef: RefObject<number>;
  readonly reconnectTimeoutRef: RefObject<NodeJS.Timeout | null>;
};

export function useConnectivityLifecycle(context: ConnectivityLifecycleContext): void {
  const { isConnected, initialCheckDone, checkConnectivity, reconnectAttemptRef, reconnectTimeoutRef } = context;

  // Initial check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void checkConnectivity();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [checkConnectivity]);

  // Automatic reconnection
  useEffect(() => {
    if (isConnected || !initialCheckDone) {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      return undefined;
    }

    const attemptReconnect = async (): Promise<void> => {
      const connected = await checkConnectivity();
      if (connected) {
        reconnectAttemptRef.current = 0;
        return undefined;
      }
      reconnectAttemptRef.current += 1;
      scheduleReconnect();
    };

    const scheduleReconnect = () => {
      const delay = getReconnectionDelay(reconnectAttemptRef.current);
      if (delay === null) return;
      reconnectTimeoutRef.current = setTimeout(() => void attemptReconnect(), delay);
    };

    scheduleReconnect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [isConnected, initialCheckDone, checkConnectivity, reconnectAttemptRef, reconnectTimeoutRef]);
}

type NetworkStatusListenersContext = {
  readonly checkConnectivity: () => Promise<boolean>;
  readonly setConnected: (connected: boolean) => void;
  readonly notifyIfDisconnected: () => void;
};

export function useNetworkStatusListeners(context: NetworkStatusListenersContext): void {
  const { checkConnectivity, setConnected, notifyIfDisconnected } = context;

  // Online/offline listeners
  useEffect(() => {
    let onlineTimeout: NodeJS.Timeout;
    const handleOnline = () => {
      clearTimeout(onlineTimeout);
      onlineTimeout = setTimeout(() => void checkConnectivity(), 500);
    };
    const handleOffline = () => {
      clearTimeout(onlineTimeout);
      setConnected(false);
      notifyIfDisconnected();
    };

    globalThis.addEventListener("online", handleOnline);
    globalThis.addEventListener("offline", handleOffline);
    return () => {
      globalThis.removeEventListener("online", handleOnline);
      globalThis.removeEventListener("offline", handleOffline);
      clearTimeout(onlineTimeout);
    };
  }, [checkConnectivity, notifyIfDisconnected, setConnected]);
}

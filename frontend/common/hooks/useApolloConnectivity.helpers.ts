"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import { logger } from "@/frontend/common/lib/logger";

const CONNECTIVITY_CHECK_URL = "/api/graphql";
const CONNECTIVITY_CHECK_TIMEOUT = 5000;
const MIN_CHECK_INTERVAL = 2000;

export const getReconnectionDelay = (attempt: number): number | null => {
  if (attempt === 0) return 2000;
  if (attempt === 1) return 5000;
  const delay = 5000 + (attempt - 1) * 5000;
  if (delay > 30000) return null;
  return delay;
};

const fetchConnectivityStatus = async (): Promise<boolean> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONNECTIVITY_CHECK_TIMEOUT);

  const response = await fetch(CONNECTIVITY_CHECK_URL, {
    method: "HEAD",
    credentials: "include",
    headers: {
      "X-Requested-With": "XMLHttpRequest",
      "apollo-require-preflight": "true",
    },
    signal: controller.signal,
  }).catch(() => ({ ok: false, status: 0 }));

  clearTimeout(timeoutId);
  return (response as { ok: boolean }).ok;
};

export type ConnectivityRunContext = {
  readonly isConnectedRef: RefObject<boolean>;
  readonly inFlightCheckRef: RefObject<Promise<boolean> | null>;
  readonly reconnectAttemptRef: RefObject<number>;
  readonly setIsChecking: Dispatch<SetStateAction<boolean>>;
  readonly setIsConnected: Dispatch<SetStateAction<boolean>>;
  readonly setLastChecked: Dispatch<SetStateAction<Date | null>>;
  readonly setInitialCheckDone: Dispatch<SetStateAction<boolean>>;
};

/**
 * Executes a single connectivity probe and applies the verdict to the
 * caller-provided refs and state setters.
 */
export const runConnectivityCheck = async (context: ConnectivityRunContext): Promise<boolean> => {
  const {
    isConnectedRef,
    inFlightCheckRef,
    reconnectAttemptRef,
    setIsChecking,
    setIsConnected,
    setLastChecked,
    setInitialCheckDone,
  } = context;

  try {
    const connected = await fetchConnectivityStatus();

    if (connected && !isConnectedRef.current) {
      reconnectAttemptRef.current = 0;
    }

    isConnectedRef.current = connected;
    queueMicrotask(() => {
      setIsConnected(connected);
      setLastChecked(new Date());
    });

    return connected;
  } catch {
    isConnectedRef.current = false;
    queueMicrotask(() => {
      setIsConnected(false);
      setLastChecked(new Date());
    });
    return false;
  } finally {
    inFlightCheckRef.current = null;
    queueMicrotask(() => {
      setIsChecking(false);
      setInitialCheckDone(true);
    });
    logger.debug({ caller: "useApolloConnectivity" }, "[Connectivity] Check completed");
  }
};

export { MIN_CHECK_INTERVAL };

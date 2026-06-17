"use client";

import { ApolloLink, Observable } from "@apollo/client";
import { ErrorLink } from "@apollo/client/link/error";
import CryptoJS from "crypto-js";
import logger from "@/frontend/lib/logger";
import { isNetworkError } from "@/frontend/utils/errorUtils";

// Browser-compatible SHA256 function for persisted queries
export const sha256 = async (data: string): Promise<string> => {
  return CryptoJS.SHA256(data).toString();
};

// Observer interface matching RxJS Observable observer
export type ObserverLike<T> = {
  next: (value: T) => void;
  error: (error: unknown) => void;
  complete: () => void;
};

// Helper to create auth link outside component to avoid nesting
export const createAuthLink = (getToken: () => string | null) => {
  return new ApolloLink((operation, forward) => {
    const token = getToken();

    const headers: Record<string, string> = {
      "apollo-require-preflight": "true",
      "x-apollo-operation-name": operation.operationName || "",
    };

    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    operation.setContext({ headers });
    return forward(operation);
  });
};

export const createSuccessHandler =
  (getConnected: () => boolean, setConnected: (v: boolean) => void, observer: ObserverLike<ApolloLink.Result>) =>
  (result: ApolloLink.Result) => {
    if (!getConnected()) {
      setConnected(true);
    }
    observer.next(result);
  };

// Helper to create connectivity link
export const createConnectivityLink = (
  getConnected: () => boolean,
  setConnected: (v: boolean) => void,
  checkConnection: () => Promise<boolean>,
  notifyDisconnected: () => void
) => {
  const subscribeToRequest = (
    forward: (operation: ApolloLink.Operation) => Observable<ApolloLink.Result>,
    operation: ApolloLink.Operation,
    observer: ObserverLike<ApolloLink.Result>
  ) => {
    return forward(operation).subscribe({
      next: createSuccessHandler(getConnected, setConnected, observer),
      error: e => observer.error(e),
      complete: () => observer.complete(),
    });
  };

  const handleDisconnected = (observer: ObserverLike<ApolloLink.Result>) => {
    notifyDisconnected();
    observer.next({
      data: null,
      errors: [
        {
          message: "Server not available",
          extensions: { code: "NETWORK_ERROR", connectivityError: true },
        },
      ],
    } as ApolloLink.Result);
    observer.complete();
  };

  return new ApolloLink((operation, forward) => {
    return new Observable<ApolloLink.Result>(observer => {
      if (getConnected()) {
        subscribeToRequest(forward, operation, observer);
      } else {
        checkConnection()
          .then(connected => {
            if (connected) {
              subscribeToRequest(forward, operation, observer);
            } else {
              handleDisconnected(observer);
            }
          })
          .catch(e => observer.error(e));
      }
    });
  });
};

// Helper to create error link
export const createErrorLinkHandler = (
  getConnected: () => boolean,
  setConnected: (v: boolean) => void,
  notifyDisconnected: () => void
) => {
  return new ErrorLink(({ error }) => {
    if (isNetworkError(error)) {
      const wasConnected = getConnected();
      logger.warn({ caller: "AppApolloProvider" }, `[Error Link] Network error detected. wasConnected=${wasConnected}`);
      setConnected(false);

      if (wasConnected) {
        logger.info({ caller: "AppApolloProvider" }, "[Error Link] Connection lost (was previously connected)");
      }

      notifyDisconnected();
    }
  });
};

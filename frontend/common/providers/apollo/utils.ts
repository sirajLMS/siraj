"use client";

import { ApolloLink, CombinedGraphQLErrors, Observable } from "@apollo/client";
import { ErrorLink } from "@apollo/client/link/error";
import CryptoJS from "crypto-js";
import { logger } from "@/frontend/common/lib/logger";
import { buildLoginHref } from "@/frontend/common/lib/safeRedirect";
import { isNetworkError } from "@/frontend/common/utils/errorUtils";

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
      "x-apollo-operation-name": operation.operationName ?? "",
    };

    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    operation.setContext({ headers });
    return forward(operation);
  });
};

const createSuccessHandler =
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
  notifyDisconnected: () => void,
  getServerNotAvailableMessage: () => string
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
          message: getServerNotAvailableMessage(),
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
            return undefined;
          })
          .catch(e => observer.error(e));
      }
    });
  });
};

// ---------------------------------------------------------------------------
// Auth recovery API — registered by AppApolloProvider so the errorLink can
// attempt a refreshToken mutation BEFORE hard-redirecting to /login on a
// UNAUTHENTICATED GraphQL response. This closes the production-only
// logout-on-navigation bug where the 15-min access_token cookie expires and
// the next me-query (60s poll / on-mount) bounces the user even though the
// long-lived refresh_token cookie is still valid.
// ---------------------------------------------------------------------------
export type AuthRecoveryApi = {
  /** Run refreshToken mutation and persist new token to React memory. Returns the fresh token or null. */
  refresh: () => Promise<string | null>;
  /** After a successful refresh, re-issue all active observable queries with the new token. */
  reFetch: () => void;
};

let authRecovery: AuthRecoveryApi | null = null;

export function registerAuthRecovery(api: AuthRecoveryApi): void {
  authRecovery = api;
  logAuthRedirectEvent("authRecovery registered", { hasApi: true });
}

export function unregisterAuthRecovery(): void {
  authRecovery = null;
  logAuthRedirectEvent("authRecovery unregistered", { hasApi: false });
}

// ---------------------------------------------------------------------------
// Production-visible diagnostics
//
// The project logger (`frontend/common/lib/logger`) is dev-only by default
// (gated on `NODE_ENV === "development"` or `NEXT_PUBLIC_ENABLE_LOGGING=true`)
// — which is why the previous "[AuthRedirect] GraphQL auth error —
// redirecting to login" log was invisible on the deployed site. We now use
// the logger directly, but pass `{ force: true }` so the recovery
// diagnostics bypass the dev-only gate and appear in the production browser
// DevTools console on the remote deployed site. The logger's existing
// PII-santizer still scrubs `token`/`refreshToken`/`accessToken` keys
// before anything is queued, and `/api/logs` is dev-only so forced logs
// are console-only on prod (no 404 noise).
// ---------------------------------------------------------------------------

const AUTH_REDIRECT_CALLER = "apollo.utils.errorLink";

function truncateId(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.length <= 8 ? value : value.slice(0, 8);
}

function logAuthRedirectEvent(message: string, payload: Record<string, unknown> = {}): void {
  try {
    logger.warn({ caller: AUTH_REDIRECT_CALLER, force: true }, "[AuthRedirect]", message, payload);
  } catch {
    // defensive: never let a logging failure swallow the redirect logic
  }
}

// Prevents multiple concurrent hard-redirects when several queries fail auth at once.
let isRedirectingToLogin = false;

// Dedupes concurrent refresh attempts so N simultaneous UNAUTHENTICATED
// responses share one refreshToken mutation (mirrors dedupedRefreshToken.ts).
let inFlightRefresh: Promise<string | null> | null = null;

async function getNewAccessToken(): Promise<string | null> {
  if (inFlightRefresh) {
    logAuthRedirectEvent("getNewAccessToken: reusing in-flight refresh");
    return inFlightRefresh;
  }

  const api = authRecovery;
  if (!api) {
    logAuthRedirectEvent("getNewAccessToken: no authRecovery registered");
    return null;
  }

  logAuthRedirectEvent("getNewAccessToken: starting refresh", {
    hadInFlight: false,
  });

  inFlightRefresh = api
    .refresh()
    .then(token => {
      logAuthRedirectEvent("getNewAccessToken: refresh resolved", {
        newTokenLength: token ? token.length : 0,
        newTokenPrefix: token ? truncateId(token) : null,
      });
      return token;
    })
    .catch(error => {
      logAuthRedirectEvent("getNewAccessToken: refresh threw", {
        errorName: error instanceof Error ? error.name : "unknown",
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      return null;
    })
    .finally(() => {
      inFlightRefresh = null;
    });

  return inFlightRefresh;
}

async function handleAuthError(error: unknown, operationName: string | undefined): Promise<boolean> {
  if (!CombinedGraphQLErrors.is(error)) return false;

  const errorCodes = error.errors.map(err => err.extensions?.code ?? "unknown");
  const isUnauthenticated = errorCodes.includes("UNAUTHENTICATED");
  const isForbidden = errorCodes.includes("FORBIDDEN");

  if (!isUnauthenticated && !isForbidden) return false;

  // Make FORBIDDEN visible on prod but DO NOT redirect (existing behavior —
  // redirecting an authenticated user on a permission denial causes a loop
  // because the auth layout bounces them straight back).
  if (isForbidden) {
    logAuthRedirectEvent("handleAuthError: FORBIDDEN (no redirect)", {
      operationName,
      errorCodes,
    });
    return false;
  }

  if (operationName === "login" || operationName === "demoLogin" || operationName === "refreshToken") {
    return false;
  }

  if (typeof globalThis.window === "undefined") return false;

  const pathname = globalThis.window.location.pathname;
  if (pathname === "/login" || pathname.endsWith("/login")) {
    return false;
  }

  logAuthRedirectEvent("handleAuthError: UNAUTHENTICATED received", {
    operationName,
    errorCodes,
    pathname,
  });

  if (isRedirectingToLogin) {
    logAuthRedirectEvent("handleAuthError: redirect already in flight — suppressing duplicate", {
      operationName,
    });
    return true;
  }

  return recoverFromUnauthenticated(operationName, pathname);
}

/**
 * Refresh-before-redirect path for UNAUTHENTICATED responses. Attempts a
 * refreshToken via the registered AuthRecoveryApi; on success stays on the
 * page (re-issuing active observable queries with the fresh token), on
 * failure hard-redirects to /login as before.
 */
async function recoverFromUnauthenticated(operationName: string | undefined, pathname: string): Promise<boolean> {
  const newToken = await getNewAccessToken();
  if (newToken) {
    // Refresh succeeded — re-issue all active observable queries with the
    // fresh token loaded into React memory by the recovery API, then reset
    // the redirect flag so we don't get stuck if a future transient
    // UNAUTHENTICATED arrives.
    isRedirectingToLogin = false;
    try {
      authRecovery?.reFetch();
      logAuthRedirectEvent("handleAuthError: recovered via refreshToken — staying on page", {
        operationName,
        pathname,
        newTokenLength: newToken.length,
      });
    } catch (reFetchError) {
      logAuthRedirectEvent("handleAuthError: reFetch threw after successful refresh", {
        operationName,
        errorName: reFetchError instanceof Error ? reFetchError.name : "unknown",
        errorMessage: reFetchError instanceof Error ? reFetchError.message : String(reFetchError),
      });
    }
    return true; // suppress the error — recovery handled it
  }

  // --- refresh failed: genuinely logged out — fall through to hard redirect --
  const search = globalThis.window.location.search;
  const currentUrl = `${pathname}${search}`;
  const targetUrl = buildLoginHref(currentUrl);
  logAuthRedirectEvent("handleAuthError: refresh failed — redirecting to login", {
    operationName,
    errorCodes: ["UNAUTHENTICATED"],
    from: currentUrl,
    to: targetUrl,
  });
  isRedirectingToLogin = true;
  globalThis.window.location.href = targetUrl;
  return true;
}

// Helper to create error link
export const createErrorLinkHandler = (
  getConnected: () => boolean,
  setConnected: (v: boolean) => void,
  notifyDisconnected: () => void
) => {
  return new ErrorLink(({ error, operation }) => {
    // Fire-and-forget the async recovery; the ErrorLink callback cannot
    // return a Promise. handleAuthError performs its own redirect + log
    // side-effects synchronously-after-await; Apollo will treat the
    // operation as having an error in the meantime, but recovery is
    // signaled by reFetchObservableQueries rather than by suppressing
    // the per-operation error.
    void handleAuthError(error, operation.operationName);

    if (error && isNetworkError(error)) {
      const wasConnected = getConnected();
      logAuthRedirectEvent("[Error Link] Network error detected", { wasConnected });
      setConnected(false);

      if (wasConnected) {
        logAuthRedirectEvent("[Error Link] Connection lost (was previously connected)", {});
      }

      notifyDisconnected();
    }
  });
};

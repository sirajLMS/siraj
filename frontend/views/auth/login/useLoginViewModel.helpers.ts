import { CombinedGraphQLErrors, ServerError } from "@apollo/client";
import type { useMutation } from "@apollo/client/react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import type {
  DemoLoginMutation,
  DemoLoginMutationVariables,
  LoginMutation,
  LoginMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { logger } from "@/frontend/common/lib/logger";
import { isSafeRedirect } from "@/frontend/common/lib/safeRedirect";
import type { AuthLoginLabels } from "@/shared/locale/types/auth";

const MAX_FRONTEND_RETRIES = 2;
const RETRY_DELAYS_MS = [1500, 3000] as const;
const DEFAULT_RETRY_DELAY_MS = 3000;

type LoginMutateFn = useMutation.MutationFunction<LoginMutation, LoginMutationVariables>;
type DemoLoginMutateFn = useMutation.MutationFunction<DemoLoginMutation, DemoLoginMutationVariables>;

export type LoginAttemptResult = { type: "success" | "error"; message: string } | null;

export type PerformLoginFn = (email: string, password: string) => Promise<boolean>;

export interface LoginMutationErrorDeps {
  readonly email: string;
  readonly password: string;
  readonly labels: AuthLoginLabels;
  readonly retryCountRef: RefObject<number>;
  readonly setIsRetrying: Dispatch<SetStateAction<boolean>>;
  readonly setLoginResult: Dispatch<SetStateAction<LoginAttemptResult>>;
  readonly updateAuthToken: (token: string) => void;
  readonly performLoginRef: RefObject<PerformLoginFn>;
}

function readExtensionCode(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  if (!("extensions" in value)) return undefined;
  const extensions = value.extensions;
  if (typeof extensions !== "object" || extensions === null) return undefined;
  if (!("code" in extensions)) return undefined;
  return typeof extensions.code === "string" ? extensions.code : undefined;
}

function getCodeFromServerErrorBody(bodyText: string): string | undefined {
  try {
    const parsed: unknown = JSON.parse(bodyText);
    if (typeof parsed !== "object" || parsed === null || !("errors" in parsed)) return undefined;
    const { errors } = parsed;
    if (!Array.isArray(errors)) return undefined;
    for (const graphError of errors) {
      const code = readExtensionCode(graphError);
      if (code) return code;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function getGraphQLErrorCode(error: unknown): string | undefined {
  if (CombinedGraphQLErrors.is(error)) {
    for (const graphError of error.errors) {
      const code = readExtensionCode(graphError);
      if (code) return code;
    }
  }
  if (ServerError.is(error)) {
    const bodyCode = getCodeFromServerErrorBody(error.bodyText);
    if (bodyCode) return bodyCode;
    if (error.statusCode === 429) return "RATE_LIMIT_EXCEEDED";
  }
  return undefined;
}

/** Map known auth extension codes to safe, localized login copy (never raw server text). */
function resolveLoginErrorMessage(error: unknown, labels: AuthLoginLabels): string {
  switch (getGraphQLErrorCode(error)) {
    case "TOO_MANY_ATTEMPTS":
      return labels.tooManyLoginAttempts;
    case "RATE_LIMIT_EXCEEDED":
      return labels.tooManyRequests;
    case "INVALID_CREDENTIALS":
      return labels.invalidCredentials;
    case "ACCOUNT_DEACTIVATED":
      return labels.accountDeactivated;
    case "SERVICE_UNAVAILABLE":
      return labels.serviceUnavailable;
    default:
      return labels.loginError;
  }
}

function logAuthRedirect(caller: string, summary: string, reason: string, extra: Record<string, unknown>): void {
  logger.info({ caller }, `[AuthRedirect] ${summary}`, {
    reason,
    from: `${globalThis.location.pathname}${globalThis.location.search}`,
    ...extra,
  });
}

/** Redirect an already-authenticated user away from the login page at most once per mount. */
export function redirectIfAuthenticated(
  isAuthenticated: boolean,
  redirectedRef: RefObject<boolean>,
  redirectUrl: string | null
): void {
  if (!isAuthenticated || redirectedRef.current) return;
  redirectedRef.current = true;
  const targetUrl = isSafeRedirect(redirectUrl);
  logAuthRedirect(
    "useLoginViewModel",
    "Hard-redirecting authenticated user away from login",
    "isAuthenticated is true after refreshToken — using full navigation so server reads new cookies",
    { redirectParam: redirectUrl, to: targetUrl }
  );
  globalThis.location.replace(targetUrl);
}

/** Navigate to the post-login target after a successful fast (demo group) login. */
function redirectAfterFastLogin(redirectUrl: string | null, groupSlug: string): void {
  const targetUrl = isSafeRedirect(redirectUrl);
  logAuthRedirect("useLoginViewModel.handleFastLogin", "Redirecting after demo login", "demoLogin mutation succeeded", {
    redirectParam: redirectUrl,
    groupSlug,
    to: targetUrl,
  });
  globalThis.location.href = targetUrl;
}

function resetLoginRetryState(
  setIsRetrying: Dispatch<SetStateAction<boolean>>,
  retryCountRef: RefObject<number>
): void {
  setIsRetrying(false);
  retryCountRef.current = 0;
}

function logLoginRetry(retry: number, delayMs: number): void {
  logger.warn({ caller: "useLoginViewModel.performLogin" }, "Cold-start: retrying login after SERVICE_UNAVAILABLE", {
    retry,
    delayMs,
  });
}

function createDelay(delayMs: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, delayMs));
}

function scheduleLoginRetry(deps: LoginMutationErrorDeps): Promise<boolean> {
  const delayMs = RETRY_DELAYS_MS[deps.retryCountRef.current] ?? DEFAULT_RETRY_DELAY_MS;
  deps.retryCountRef.current += 1;
  deps.setIsRetrying(true);
  logLoginRetry(deps.retryCountRef.current, delayMs);
  return createDelay(delayMs).then(() => deps.performLoginRef.current(deps.email, deps.password));
}

/** Retry transient SERVICE_UNAVAILABLE failures, then surface a localized error message. */
function recoverLoginMutationError(error: unknown, deps: LoginMutationErrorDeps): Promise<boolean> {
  const code = getGraphQLErrorCode(error);
  if (code === "SERVICE_UNAVAILABLE" && deps.retryCountRef.current < MAX_FRONTEND_RETRIES) {
    return scheduleLoginRetry(deps);
  }
  resetLoginRetryState(deps.setIsRetrying, deps.retryCountRef);
  deps.setLoginResult({ type: "error", message: resolveLoginErrorMessage(error, deps.labels) });
  return Promise.resolve(false);
}

function failLoginAttempt(
  message: string,
  setLoginResult: Dispatch<SetStateAction<LoginAttemptResult>>,
  setIsRetrying: Dispatch<SetStateAction<boolean>>,
  retryCountRef: RefObject<number>
): boolean {
  resetLoginRetryState(setIsRetrying, retryCountRef);
  setLoginResult({ type: "error", message });
  return false;
}

/** Execute the credential login mutation, storing the token and surfacing localized failures. */
export async function runLoginMutation(loginMutation: LoginMutateFn, deps: LoginMutationErrorDeps): Promise<boolean> {
  try {
    const result = await loginMutation({ variables: { input: { email: deps.email, password: deps.password } } });
    const loginPayload = result.data?.login;
    if (loginPayload?.token && loginPayload.user) {
      deps.updateAuthToken(loginPayload.token);
      resetLoginRetryState(deps.setIsRetrying, deps.retryCountRef);
      return true;
    }
    return failLoginAttempt(
      deps.labels.invalidLoginResponse,
      deps.setLoginResult,
      deps.setIsRetrying,
      deps.retryCountRef
    );
  } catch (error) {
    return recoverLoginMutationError(error, deps);
  }
}

/** Execute the demo-group login mutation and navigate or surface a localized failure. */
export async function submitFastLogin(
  demoLoginMutation: DemoLoginMutateFn,
  groupSlug: string,
  redirectUrl: string | null,
  updateAuthToken: (token: string) => void,
  setLoginResult: Dispatch<SetStateAction<LoginAttemptResult>>,
  labels: AuthLoginLabels
): Promise<void> {
  setLoginResult(null);
  try {
    const { data } = await demoLoginMutation({ variables: { input: { groupSlug } } });
    const demoPayload = data?.demoLogin;
    if (demoPayload?.token && demoPayload.user) {
      updateAuthToken(demoPayload.token);
      redirectAfterFastLogin(redirectUrl, groupSlug);
    } else {
      setLoginResult({ type: "error", message: labels.loginError });
    }
  } catch (error) {
    setLoginResult({ type: "error", message: resolveLoginErrorMessage(error, labels) });
  }
}

"use client";

import { CombinedGraphQLErrors, ServerError } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { demoLoginMutationDocument, loginMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useAuth } from "@/frontend/common/hooks/useAuth";
import { useAuthToken } from "@/frontend/common/hooks/useAuthToken";
import { logger } from "@/frontend/common/lib/logger";
import { isSafeRedirect, LOGIN_REDIRECT_PARAM } from "@/frontend/common/lib/safeRedirect";
import type { LoginFormData } from "@/frontend/views/auth/login/schemas/loginSchema";
import { parseEnvConfigBoolean } from "@/shared/constants/features/sidebarFeatures.constants";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { AuthLoginLabels } from "@/shared/locale/types/auth";

const MAX_FRONTEND_RETRIES = 2;
const RETRY_DELAYS_MS = [1500, 3000] as const;

export interface UseLoginViewModelOptions {
  readonly demoGroups?: { slug: string; name: string; description: string | null }[];
}

export interface LoginViewModel {
  readonly labels: AuthLoginLabels;
  readonly loginResult: { type: "success" | "error"; message: string } | null;
  readonly isDemo: boolean;
  readonly isRetrying: boolean;
  readonly demoGroups: { slug: string; name: string; description: string | null }[];
  readonly handleLoginSubmit: (data: LoginFormData) => Promise<void>;
  readonly handleFastLogin: (groupSlug: string) => Promise<void>;
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

export function useLoginViewModel({ demoGroups = [] }: UseLoginViewModelOptions = {}): LoginViewModel {
  const labels = useAppTranslation(Translation.Auth.Login);
  const searchParams = useSearchParams();
  const { error: authError, isAuthenticated } = useAuth();
  const { updateAuthToken } = useAuthToken();
  const [demoLoginMutation] = useMutation(demoLoginMutationDocument);
  const [loginMutation] = useMutation(loginMutationDocument);

  const [loginResult, setLoginResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const redirectedRef = useRef(false);
  const retryCountRef = useRef(0);

  useEffect(() => {
    if (!isAuthenticated || redirectedRef.current) {
      return;
    }

    redirectedRef.current = true;
    const redirectUrl = searchParams.get(LOGIN_REDIRECT_PARAM);
    const targetUrl = isSafeRedirect(redirectUrl);
    logger.info({ caller: "useLoginViewModel" }, "[AuthRedirect] Hard-redirecting authenticated user away from login", {
      reason: "isAuthenticated is true after refreshToken — using full navigation so server reads new cookies",
      from: `${globalThis.location.pathname}${globalThis.location.search}`,
      redirectParam: redirectUrl,
      to: targetUrl,
    });
    globalThis.location.replace(targetUrl);
  }, [isAuthenticated, searchParams]);

  const performLoginRef = useRef<(email: string, password: string) => Promise<boolean>>(async () => false);

  const performLogin = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        const result = await loginMutation({
          variables: { input: { email, password } },
        });

        if (result.data?.login?.token && result.data.login.user) {
          updateAuthToken(result.data.login.token);
          setIsRetrying(false);
          retryCountRef.current = 0;
          return true;
        }

        setIsRetrying(false);
        retryCountRef.current = 0;
        setLoginResult({ type: "error", message: labels.invalidLoginResponse });
        return false;
      } catch (error) {
        const code = getGraphQLErrorCode(error);
        if (code === "SERVICE_UNAVAILABLE" && retryCountRef.current < MAX_FRONTEND_RETRIES) {
          const delayMs = RETRY_DELAYS_MS[retryCountRef.current] ?? 3000;
          retryCountRef.current += 1;
          setIsRetrying(true);
          logger.warn(
            { caller: "useLoginViewModel.performLogin" },
            "Cold-start: retrying login after SERVICE_UNAVAILABLE",
            {
              retry: retryCountRef.current,
              delayMs,
            }
          );
          await new Promise(resolve => setTimeout(resolve, delayMs));
          return performLoginRef.current(email, password);
        }
        setIsRetrying(false);
        retryCountRef.current = 0;
        setLoginResult({ type: "error", message: resolveLoginErrorMessage(error, labels) });
        return false;
      }
    },
    [loginMutation, updateAuthToken, labels]
  );

  useEffect(() => {
    performLoginRef.current = performLogin;
  }, [performLogin]);

  const handleLoginSubmit = async (data: LoginFormData) => {
    const redirectUrl = searchParams.get(LOGIN_REDIRECT_PARAM);
    setLoginResult(null);
    retryCountRef.current = 0;

    const success = await performLogin(data.email, data.password);
    if (success) {
      setLoginResult({ type: "success", message: labels.loginSuccess });
      const targetUrl = isSafeRedirect(redirectUrl);
      globalThis.location.replace(targetUrl);
    }
  };

  const handleFastLogin = async (groupSlug: string) => {
    const redirectUrl = searchParams.get(LOGIN_REDIRECT_PARAM);
    setLoginResult(null);

    try {
      const { data } = await demoLoginMutation({ variables: { input: { groupSlug } } });
      if (data?.demoLogin?.token && data.demoLogin.user) {
        updateAuthToken(data.demoLogin.token);
        const targetUrl = isSafeRedirect(redirectUrl);
        logger.info({ caller: "useLoginViewModel.handleFastLogin" }, "[AuthRedirect] Redirecting after demo login", {
          reason: "demoLogin mutation succeeded",
          from: `${globalThis.location.pathname}${globalThis.location.search}`,
          redirectParam: redirectUrl,
          groupSlug,
          to: targetUrl,
        });
        globalThis.location.href = targetUrl;
      } else {
        setLoginResult({ type: "error", message: labels.loginError });
      }
    } catch (error) {
      setLoginResult({ type: "error", message: resolveLoginErrorMessage(error, labels) });
    }
  };

  const isDemo = parseEnvConfigBoolean(process.env.NEXT_PUBLIC_IS_DEMO);
  const effectiveLoginResult = loginResult ?? (authError ? { type: "error" as const, message: authError } : null);

  return {
    labels,
    loginResult: effectiveLoginResult,
    isDemo,
    isRetrying,
    demoGroups,
    handleLoginSubmit,
    handleFastLogin,
  };
}

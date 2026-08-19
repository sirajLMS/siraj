"use client";

import { CombinedGraphQLErrors } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { demoLoginMutationDocument, loginMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useAuth } from "@/frontend/common/hooks/useAuth";
import { useAuthToken } from "@/frontend/common/hooks/useAuthToken";
import { logger } from "@/frontend/common/lib/logger";
import { isSafeRedirect, LOGIN_REDIRECT_PARAM } from "@/frontend/common/lib/safeRedirect";
import type { LoginFormData } from "@/frontend/views/auth/login/schemas/loginSchema";
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

function getServiceUnavailableCode(error: unknown): string | undefined {
  if (CombinedGraphQLErrors.is(error)) {
    for (const graphError of error.errors) {
      const code = graphError?.extensions?.code;
      if (typeof code === "string") return code;
    }
  }
  return undefined;
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

  useEffect(() => {
    if (authError) {
      setLoginResult({ type: "error", message: authError });
    }
  }, [authError]);

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
        const code = getServiceUnavailableCode(error);
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
        const message = CombinedGraphQLErrors.is(error)
          ? (error.errors[0]?.message ?? labels.signinFailed)
          : labels.signinFailed;
        setLoginResult({ type: "error", message });
        return false;
      }
    },
    [loginMutation, updateAuthToken, labels.signinFailed, labels.invalidLoginResponse]
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
        setLoginResult({ type: "error", message: labels.invalidCredentials });
      }
    } catch {
      setLoginResult({ type: "error", message: labels.loginError });
    }
  };

  const isDemo = Boolean(process.env.NEXT_PUBLIC_IS_DEMO);

  return {
    labels,
    loginResult,
    isDemo,
    isRetrying,
    demoGroups,
    handleLoginSubmit,
    handleFastLogin,
  };
}

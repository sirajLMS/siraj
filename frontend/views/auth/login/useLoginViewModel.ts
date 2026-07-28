"use client";

import { useMutation } from "@apollo/client/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { demoLoginMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useAuth } from "@/frontend/common/hooks/useAuth";
import { useAuthToken } from "@/frontend/common/hooks/useAuthToken";
import logger from "@/frontend/common/lib/logger";
import { isSafeRedirect, LOGIN_REDIRECT_PARAM } from "@/frontend/common/lib/safeRedirect";
import type { LoginFormData } from "@/frontend/views/auth/login/schemas/loginSchema";
import { TranslationBeta, useAppTranslationBeta } from "@/shared/locale/beta";
import type { AuthLoginLabels } from "@/shared/locale/types/auth";

export interface UseLoginViewModelOptions {
  readonly demoGroups?: { slug: string; name: string; description: string | null }[];
}

export interface LoginViewModel {
  readonly labels: AuthLoginLabels;
  readonly loginResult: { type: "success" | "error"; message: string } | null;
  readonly isDemo: boolean;
  readonly demoGroups: { slug: string; name: string; description: string | null }[];
  readonly handleLoginSubmit: (data: LoginFormData) => Promise<void>;
  readonly handleFastLogin: (groupSlug: string) => Promise<void>;
}

export function useLoginViewModel({ demoGroups = [] }: UseLoginViewModelOptions = {}): LoginViewModel {
  const labels = useAppTranslationBeta(TranslationBeta.Auth.Login);
  const searchParams = useSearchParams();
  const { login, error: authError, isAuthenticated } = useAuth();
  const { updateAuthToken } = useAuthToken();
  const [demoLoginMutation] = useMutation(demoLoginMutationDocument);

  const [loginResult, setLoginResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const redirectedRef = useRef(false);

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

  const handleLoginSubmit = async (data: LoginFormData) => {
    const redirectUrl = searchParams.get(LOGIN_REDIRECT_PARAM);
    setLoginResult(null);

    try {
      const success = await login({ input: { email: data.email, password: data.password } }, redirectUrl);
      if (success) {
        setLoginResult({ type: "success", message: labels.loginSuccess });
      } else {
        setLoginResult({ type: "error", message: authError ?? labels.invalidCredentials });
      }
    } catch (error) {
      setLoginResult({ type: "error", message: labels.loginError });
      throw error;
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
    demoGroups,
    handleLoginSubmit,
    handleFastLogin,
  };
}

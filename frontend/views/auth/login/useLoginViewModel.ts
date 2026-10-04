"use client";

import { useMutation } from "@apollo/client/react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { demoLoginMutationDocument, loginMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useAuth } from "@/frontend/common/hooks/useAuth";
import { useAuthToken } from "@/frontend/common/hooks/useAuthToken";
import { isSafeRedirect, LOGIN_REDIRECT_PARAM } from "@/frontend/common/lib/safeRedirect";
import type { LoginFormData } from "@/frontend/views/auth/login/schemas/loginSchema";
import {
  type LoginAttemptResult,
  type PerformLoginFn,
  redirectIfAuthenticated,
  runLoginMutation,
  submitFastLogin,
} from "@/frontend/views/auth/login/useLoginViewModel.helpers";
import { parseEnvConfigBoolean } from "@/shared/constants/features/sidebarFeatures.constants";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { AuthLoginLabels } from "@/shared/locale/types/auth";

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

export function useLoginViewModel({ demoGroups = [] }: UseLoginViewModelOptions = {}): LoginViewModel {
  const labels = useAppTranslation(Translation.Auth.Login);
  const searchParams = useSearchParams();
  const { error: authError, isAuthenticated } = useAuth();
  const { updateAuthToken } = useAuthToken();
  const [demoLoginMutation] = useMutation(demoLoginMutationDocument);
  const [loginMutation] = useMutation(loginMutationDocument);

  const [loginResult, setLoginResult] = useState<LoginAttemptResult>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const redirectedRef = useRef(false);
  const retryCountRef = useRef(0);

  useEffect(() => {
    redirectIfAuthenticated(isAuthenticated, redirectedRef, searchParams.get(LOGIN_REDIRECT_PARAM));
  }, [isAuthenticated, searchParams]);

  const performLoginRef = useRef<PerformLoginFn>(async () => false);

  const performLogin = useCallback(
    (email: string, password: string): Promise<boolean> =>
      runLoginMutation(loginMutation, {
        email,
        password,
        labels,
        retryCountRef,
        setIsRetrying,
        setLoginResult,
        updateAuthToken,
        performLoginRef,
      }),
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
      globalThis.location.replace(isSafeRedirect(redirectUrl));
    }
  };

  const handleFastLogin = (groupSlug: string): Promise<void> =>
    submitFastLogin(
      demoLoginMutation,
      groupSlug,
      searchParams.get(LOGIN_REDIRECT_PARAM),
      updateAuthToken,
      setLoginResult,
      labels
    );

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

"use client";

import { useMutation } from "@apollo/client/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { demoLoginMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useAuth } from "@/frontend/common/hooks/useAuth";
import { useAuthToken } from "@/frontend/common/hooks/useAuthToken";
import logger from "@/frontend/common/lib/logger";
import { isSafeRedirect, LOGIN_REDIRECT_PARAM } from "@/frontend/common/lib/safeRedirect";
import { LoginView } from "@/frontend/views/auth/login/LoginView";
import type { LoginFormData } from "@/frontend/views/auth/login/schemas/loginSchema";
import { useAppTranslation } from "@/shared/locale/client";

export interface LoginContainerProps {
  demoGroups?: { slug: string; name: string; description: string | null }[];
}

export function LoginContainer({ demoGroups }: Readonly<LoginContainerProps>) {
  const t = useAppTranslation().authTranslations.login;
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
    logger.info({ caller: "LoginContainer" }, "[AuthRedirect] Hard-redirecting authenticated user away from login", {
      reason: "isAuthenticated is true after refreshToken — using full navigation so server reads new cookies",
      from: `${globalThis.location.pathname}${globalThis.location.search}`,
      redirectParam: redirectUrl,
      to: targetUrl,
    });
    // Hard navigation (not router.replace) so the server layout re-runs with Set-Cookie headers applied.
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
        setLoginResult({ type: "success", message: t.loginSuccess });
      } else {
        setLoginResult({ type: "error", message: authError ?? t.invalidCredentials });
      }
    } catch (e) {
      setLoginResult({ type: "error", message: t.loginError });
      throw e; // Rethrow to let LoginForm know it failed
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
        logger.info({ caller: "LoginContainer.handleFastLogin" }, "[AuthRedirect] Redirecting after demo login", {
          reason: "demoLogin mutation succeeded",
          from: `${globalThis.location.pathname}${globalThis.location.search}`,
          redirectParam: redirectUrl,
          groupSlug,
          to: targetUrl,
        });
        globalThis.location.href = targetUrl;
      } else {
        setLoginResult({ type: "error", message: t.invalidCredentials });
      }
    } catch {
      setLoginResult({ type: "error", message: t.loginError });
    }
  };

  // NEXT_PUBLIC_IS_DEMO controls client-side demo UI visibility.
  // The actual demo login is gated server-side by IS_DEMO env var in auth.mutation.ts.
  const isDemo = Boolean(process.env.NEXT_PUBLIC_IS_DEMO);

  return (
    <LoginView
      onSubmitAction={handleLoginSubmit}
      externalLoginResult={loginResult}
      isDemo={isDemo}
      demoGroups={demoGroups}
      onFastLogin={handleFastLogin}
    />
  );
}

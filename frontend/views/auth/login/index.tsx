"use client";

import { useMutation } from "@apollo/client/react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { demoLoginMutationDocument } from "@/frontend/graphql/sharedDocuments/auth.documents";
import { useAuth } from "@/frontend/hooks/useAuth";
import { useAuthToken } from "@/frontend/hooks/useAuthToken";
import { isSafeRedirect } from "@/frontend/lib/safeRedirect";
import { useRouter } from "@/shared/i18n/routing";
import { LoginView } from "./LoginView";
import type { LoginFormData } from "./schemas/loginSchema";

export interface LoginContainerProps {
  demoGroups?: { slug: string; name: string; description: string | null }[];
}

export function LoginContainer({ demoGroups }: Readonly<LoginContainerProps>) {
  const t = useTranslations("auth.login");
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login, error: authError, isAuthenticated } = useAuth();
  const { updateAuthToken } = useAuthToken();
  const [demoLoginMutation] = useMutation(demoLoginMutationDocument);

  const [loginResult, setLoginResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      const redirectUrl = searchParams.get("redirect");
      const targetUrl = isSafeRedirect(redirectUrl);
      router.replace(targetUrl);
    }
  }, [isAuthenticated, router, searchParams]);

  useEffect(() => {
    if (authError) {
      setLoginResult({ type: "error", message: authError });
    }
  }, [authError]);

  const handleLoginSubmit = async (data: LoginFormData) => {
    const redirectUrl = searchParams.get("redirect");
    setLoginResult(null);

    try {
      const success = await login({ input: { email: data.email, password: data.password } }, redirectUrl);
      if (success) {
        setLoginResult({ type: "success", message: t("loginSuccess") });
      } else {
        setLoginResult({ type: "error", message: t("invalidCredentials") });
      }
    } catch (e) {
      setLoginResult({ type: "error", message: t("loginError") });
      throw e; // Rethrow to let LoginForm know it failed
    }
  };

  const handleFastLogin = async (groupSlug: string) => {
    const redirectUrl = searchParams.get("redirect");
    setLoginResult(null);

    try {
      const { data } = await demoLoginMutation({ variables: { input: { groupSlug } } });
      if (data?.demoLogin?.token && data.demoLogin.user) {
        updateAuthToken(data.demoLogin.token);
        globalThis.location.href = isSafeRedirect(redirectUrl);
      } else {
        setLoginResult({ type: "error", message: t("invalidCredentials") });
      }
    } catch {
      setLoginResult({ type: "error", message: t("loginError") });
    }
  };

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

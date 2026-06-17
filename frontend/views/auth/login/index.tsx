"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useAuth } from "@/frontend/hooks/useAuth";
import { LoginView } from "./LoginView";
import type { LoginFormData } from "./schemas/loginSchema";

export function LoginContainer() {
  const t = useTranslations("auth.login");
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login, error: authError, isAuthenticated } = useAuth();

  const [loginResult, setLoginResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      const redirectUrl = searchParams.get("redirect");
      const targetUrl = redirectUrl || "/dashboard";
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

  const handleFastLogin = async (email: string, password: string) => {
    const redirectUrl = searchParams.get("redirect");
    setLoginResult(null);

    try {
      const success = await login({ input: { email, password } }, redirectUrl);
      if (success) {
        setLoginResult({ type: "success", message: t("loginSuccess") });
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
      onFastLogin={handleFastLogin}
    />
  );
}

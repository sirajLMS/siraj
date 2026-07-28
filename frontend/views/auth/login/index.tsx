"use client";

import { LoginView } from "@/frontend/views/auth/login/LoginView";
import { type UseLoginViewModelOptions, useLoginViewModel } from "@/frontend/views/auth/login/useLoginViewModel";

export type LoginContainerProps = UseLoginViewModelOptions;

export function LoginContainer({ demoGroups }: Readonly<LoginContainerProps>) {
  const {
    labels,
    loginResult,
    isDemo,
    demoGroups: groups,
    handleLoginSubmit,
    handleFastLogin,
  } = useLoginViewModel({
    demoGroups,
  });

  return (
    <LoginView
      labels={labels}
      onSubmitAction={handleLoginSubmit}
      externalLoginResult={loginResult}
      isDemo={isDemo}
      demoGroups={groups}
      onFastLogin={handleFastLogin}
    />
  );
}

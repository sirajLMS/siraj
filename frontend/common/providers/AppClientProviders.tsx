"use client";

import type { ReactNode } from "react";
import { AppApolloProvider } from "@/frontend/common/context";
import { AuthProvider } from "@/frontend/common/providers/apollo/AuthProvider";
import { LocaleProvider } from "@/frontend/common/providers/LocaleProvider";
import { ViewportProvider } from "@/frontend/common/providers/theme/ViewportProvider";
import type { AppLocale } from "@/shared/locale/AppLocale";

interface AppClientProvidersProps {
  readonly children: ReactNode;
  readonly locale: AppLocale;
}

/**
 * Apollo + auth for route groups that need client mutations (login) or session
 * refresh (Dashboard). Kept out of the root layout so `/` and other server-only
 * routes avoid connectivity probes and refreshToken on mount.
 */
export function AppClientProviders({ children, locale }: Readonly<AppClientProvidersProps>) {
  return (
    <LocaleProvider locale={locale}>
      <ViewportProvider>
        <AppApolloProvider>
          <AuthProvider>{children}</AuthProvider>
        </AppApolloProvider>
      </ViewportProvider>
    </LocaleProvider>
  );
}

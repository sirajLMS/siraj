"use client";

import type { ReactNode } from "react";
import { AppApolloProvider } from "@/frontend/common/context";
import { AuthProvider } from "@/frontend/common/providers/apollo/AuthProvider";

interface AppClientProvidersProps {
  readonly children: ReactNode;
}

/**
 * Apollo + auth for route groups that need client mutations (login) or session
 * refresh (dashboard). Kept out of the root layout so `/` and other server-only
 * routes avoid connectivity probes and refreshToken on mount.
 */
export function AppClientProviders({ children }: Readonly<AppClientProvidersProps>) {
  return (
    <AppApolloProvider>
      <AuthProvider>{children}</AuthProvider>
    </AppApolloProvider>
  );
}

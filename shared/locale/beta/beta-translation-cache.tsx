"use client";

import { type ReactNode, Suspense } from "react";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readBetaTranslation } from "@/shared/locale/beta/beta-translation-cache-store";
import type { BetaNamespaceHandle } from "@/shared/locale/beta/define-beta-namespace";

export function useBetaTranslation<TLabels>(handle: BetaNamespaceHandle<TLabels>, locale: AppLocale): TLabels {
  return readBetaTranslation(handle, locale);
}

export interface BetaTranslationProviderProps {
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
}

export function BetaTranslationProvider({
  children,
  fallback = null,
}: Readonly<BetaTranslationProviderProps>): ReactNode {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

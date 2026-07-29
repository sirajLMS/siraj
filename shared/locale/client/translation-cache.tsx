"use client";

import { type ReactNode, Suspense } from "react";

export interface TranslationProviderProps {
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
}

export function TranslationProvider({ children, fallback = null }: Readonly<TranslationProviderProps>): ReactNode {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

"use client";

import type { ReactNode } from "react";
import { BetaTranslationProvider } from "@/shared/locale/beta";

export function AuthBetaTranslationProvider({ children }: { readonly children: ReactNode }) {
  return <BetaTranslationProvider>{children}</BetaTranslationProvider>;
}

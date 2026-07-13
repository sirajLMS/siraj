"use client";

import { createContext, useContext } from "react";

export type ViewportTier = "mobile" | "tablet" | "desktop";

export interface ViewportContextType {
  readonly tier: ViewportTier;
  readonly isMobile: boolean;
  readonly isTablet: boolean;
  readonly isDesktop: boolean;
}

export const ViewportContext = createContext<ViewportContextType | undefined>(undefined);

export function useViewport(): ViewportContextType {
  const context = useContext(ViewportContext);
  if (!context) {
    throw new Error("useViewport must be used within a ViewportProvider");
  }
  return context;
}

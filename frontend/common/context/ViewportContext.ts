"use client";

import { createContext } from "react";

export type ViewportTier = "mobile" | "tablet" | "desktop";

export interface ViewportContextType {
  readonly tier: ViewportTier;
  readonly isMobile: boolean;
  readonly isTablet: boolean;
  readonly isDesktop: boolean;
}

export const ViewportContext = createContext<ViewportContextType | undefined>(undefined);

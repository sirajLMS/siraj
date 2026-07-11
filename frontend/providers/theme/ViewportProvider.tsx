"use client";

import { useTheme, useMediaQuery } from "@mui/material";
import { ViewportContext, type ViewportContextType, type ViewportTier } from "@/frontend/context/ViewportContext";
import { useMemo } from "react";
import type { ReactNode } from "react";

interface ViewportProviderProps {
  readonly children: ReactNode;
}

export function ViewportProvider({ children }: ViewportProviderProps) {
  const theme = useTheme();
  
  // MUI default breakpoints: sm=600, md=900, lg=1200, xl=1536
  // Tier: mobile (<600), tablet (600-900), desktop (>=900)
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"), { noSsr: true });
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"), { noSsr: true });
  
  const tier = useMemo<ViewportTier>(() => {
    if (isMobile) return "mobile";
    if (isTablet) return "tablet";
    return "desktop";
  }, [isMobile, isTablet]);

  const value = useMemo<ViewportContextType>(
    () => ({
      tier,
      isMobile: tier === "mobile" || tier === "tablet", // down("md") equivalent
      isTablet: tier === "tablet",
      isDesktop: tier === "desktop",
    }),
    [tier]
  );

  return <ViewportContext.Provider value={value}>{children}</ViewportContext.Provider>;
}
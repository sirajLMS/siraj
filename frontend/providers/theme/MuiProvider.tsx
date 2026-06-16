"use client";

import type { PaletteMode } from "@mui/material/styles";
import type { ReactNode } from "react";
import EmotionCacheProvider from "../../lib/emotion-cache";
import { AppThemeProvider } from "./ThemeProvider";

interface MuiProviderProps {
  readonly children: ReactNode;
  readonly initialTheme?: PaletteMode;
}

export default function MuiProvider({ children, initialTheme }: MuiProviderProps) {
  return (
    <EmotionCacheProvider>
      <AppThemeProvider initialTheme={initialTheme}>{children}</AppThemeProvider>
    </EmotionCacheProvider>
  );
}

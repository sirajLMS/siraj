"use client";

import type { PaletteMode } from "@mui/material/styles";
import type { ReactNode } from "react";
import EmotionCacheProvider from "../../lib/emotion-cache";
import { AppThemeProvider } from "./ThemeProvider";

interface MuiProviderProps {
  readonly children: ReactNode;
  readonly initialTheme?: PaletteMode;
  readonly nonce?: string;
}

export default function MuiProvider({ children, initialTheme, nonce }: MuiProviderProps) {
  return (
    <EmotionCacheProvider nonce={nonce}>
      <AppThemeProvider initialTheme={initialTheme}>{children}</AppThemeProvider>
    </EmotionCacheProvider>
  );
}

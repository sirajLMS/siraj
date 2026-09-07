"use client";

import type { PaletteMode } from "@mui/material/styles";
import type { ReactNode } from "react";
import EmotionCacheProvider from "@/frontend/common/lib/emotion-cache";
import type { AppearancePresetId } from "@/frontend/common/providers/theme/presets";
import { AppThemeProvider } from "@/frontend/common/providers/theme/ThemeProvider";

interface MuiProviderProps {
  readonly children: ReactNode;
  // Server-read theme cookie value; threaded to the AppThemeProvider as
  // `defaultMode` for the cssVars-aware ThemeProvider (prevents SSR flash).
  readonly initialTheme?: PaletteMode;
  readonly appearancePresetId?: AppearancePresetId;
  readonly nonce?: string;
}

export default function MuiProvider({ children, initialTheme, appearancePresetId, nonce }: MuiProviderProps) {
  return (
    <EmotionCacheProvider nonce={nonce}>
      <AppThemeProvider initialTheme={initialTheme} appearancePresetId={appearancePresetId}>
        {children}
      </AppThemeProvider>
    </EmotionCacheProvider>
  );
}

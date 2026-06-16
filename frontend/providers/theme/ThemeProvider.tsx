"use client";

import { CssBaseline } from "@mui/material";
import type { PaletteMode } from "@mui/material/styles";
import { ThemeProvider } from "@mui/material/styles";
import { useLocale } from "next-intl";
import { type ReactNode, startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import { getClientTheme, getCookie, setThemePreference } from "../../lib/theme-detection";
import { logger } from "../../utils/logger";
import { createAppTheme } from "./theme";

interface AppThemeProviderProps {
  readonly children: ReactNode;
  readonly initialTheme?: PaletteMode; // Allow server to pass initial theme
}

export function AppThemeProvider({ children, initialTheme }: AppThemeProviderProps) {
  const [mode, setMode] = useState<PaletteMode>(initialTheme ?? "dark");
  const locale = useLocale();
  const direction = locale === "ar" ? "rtl" : "ltr";

  // Load theme preference from client on mount
  useEffect(() => {
    // First check cookie (in case it was updated by another tab)
    getCookie("theme-mode")
      .then(cookieTheme => {
        const clientTheme = cookieTheme === "light" || cookieTheme === "dark" ? cookieTheme : getClientTheme();

        if (clientTheme !== mode) {
          startTransition(() => {
            setMode(clientTheme);
          });
        }
      })
      .catch(() => {
        // Fallback to getClientTheme if cookie reading fails
        const clientTheme = getClientTheme();
        if (clientTheme !== mode) {
          startTransition(() => {
            setMode(clientTheme);
          });
        }
      });
  }, [mode]);

  // Sync data-theme, colorScheme, lang and dir attributes for CSS variable application and layout flow
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = mode;
      document.documentElement.style.colorScheme = mode;
      document.documentElement.dir = direction;
      document.documentElement.lang = locale;
    }
  }, [mode, direction, locale]);

  const toggleTheme = useCallback(() => {
    const newMode = mode === "light" ? "dark" : "light";
    setMode(newMode);
    setThemePreference(newMode); // This sets both localStorage and cookie
  }, [mode]);

  const theme = useMemo(() => createAppTheme(mode, direction, locale), [mode, direction, locale]);
  const themeContextValue = useMemo(() => ({ mode, toggleTheme }), [mode, toggleTheme]);

  logger.info(`Theme Provider: ${mode}`);
  logger.info(`Theme Provider: ${direction}`);
  return (
    <ThemeContext.Provider value={themeContextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

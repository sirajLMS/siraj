// cspell:disable
// /* eslint-disable local-rules/no-hardcoded-colors */
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { CssBaseline, GlobalStyles, type PaletteMode, ThemeProvider } from "@mui/material";
import type { StoryContext, StoryFn } from "@storybook/react";
import { NextIntlClientProvider } from "next-intl";
import { useEffect, useMemo } from "react";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";
import { ThemeContext } from "@/frontend/context/ThemeContext";
import { createAppTheme } from "@/frontend/providers/theme/theme";
import ar from "@/shared/messages/ar";
import en from "@/shared/messages/en";

// Create Emotion caches for Storybook
const cacheLtr = createCache({
  key: "sb-ltr",
  prepend: true,
});

const cacheRtl = createCache({
  key: "sb-rtl",
  prepend: true,
  stylisPlugins: [prefixer, rtlPlugin],
});

export const StoryWrapper = ({ Story, context }: { Story: StoryFn; context: StoryContext }) => {
  const locale = (context.globals.locale as string | undefined) ?? "ar";
  const themeMode = (context.globals.theme as PaletteMode | undefined) ?? "dark";
  const direction: "rtl" | "ltr" = locale === "ar" ? "rtl" : "ltr";
  const messages = locale === "ar" ? ar : en;

  // Build the theme object directly to avoid Next.js-specific provider issues
  const theme = useMemo(() => createAppTheme(themeMode, direction, locale), [themeMode, direction, locale]);
  const cache = direction === "rtl" ? cacheRtl : cacheLtr;

  const themeContextValue = useMemo(() => ({ mode: themeMode, toggleTheme: () => {} }), [themeMode]);

  // Sync document attributes for global CSS and directionality
  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = locale;
    document.documentElement.dataset.theme = themeMode;
  }, [direction, locale, themeMode]);

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <ThemeContext.Provider value={themeContextValue}>
        <CacheProvider value={cache}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <GlobalStyles
              styles={theme => ({
                ".sbdocs-wrapper": {
                  maxWidth: "100% !important",
                  padding: "2rem !important",
                  backgroundColor: `${theme.palette.background.default} !important`,
                },
                ".sbdocs-preview, .docs-story, .innerZoomElementWrapper, .docs-story > div, .sbdocs [role='toolbar']": {
                  backgroundColor: `${theme.palette.background.default} !important`,
                  borderColor: `${theme.palette.divider} !important`,
                  color: `${theme.palette.text.primary} !important`,
                },
                ".sbdocs-content": {
                  maxWidth: "100% !important",
                  width: "100% !important",
                },
                ".sbdocs-title, .sbdocs-h1, .sbdocs-h2, .sbdocs-h3": {
                  color: `${theme.palette.text.primary} !important`,
                },
                ".sbdocs-p, .sbdocs-li, .sbdocs-a": {
                  color: `${theme.palette.text.secondary} !important`,
                },
                ".sbdocs button, .sbdocs a, .sbdocs [role='toolbar'] button": {
                  color: `${theme.palette.text.primary} !important`,
                },
              })}
            />
            {Story(context.args, context)}
          </ThemeProvider>
        </CacheProvider>
      </ThemeContext.Provider>
    </NextIntlClientProvider>
  );
};

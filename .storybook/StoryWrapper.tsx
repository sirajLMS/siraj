// cspell:disable
import { CacheProvider } from "@emotion/react";
import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import type { StoryContext, StoryFn } from "@storybook/nextjs-vite";
import { useEffect, useMemo } from "react";
import { ThemeContext } from "@/frontend/common/context/ThemeContext";
import { LocaleProvider } from "@/frontend/common/providers/LocaleProvider";
import { createAppCssVarsTheme } from "@/frontend/common/providers/theme/theme";
import { ViewportProvider } from "@/frontend/common/providers/theme/ViewportProvider";
import { STORYBOOK_CACHES } from "./story-wrapper.constants";
import { checkIsUiComponent, resolveStorybookGlobals, seedStorybookAdminUser } from "./story-wrapper.helpers";
import { RenderStory, StorybookColorSchemeBridge, StoryCanvas, StoryGlobalStyles } from "./story-wrapper.parts";

export const StoryWrapper = ({ Story, context }: { Story: StoryFn; context: StoryContext }) => {
  const { locale, themeMode, viewport, direction } = resolveStorybookGlobals(context);

  // CSS-variables theme matches the App Router provider; mode toggles via useColorScheme.
  const theme = useMemo(() => createAppCssVarsTheme(direction, locale, themeMode), [direction, locale, themeMode]);
  const cache = direction === "rtl" ? STORYBOOK_CACHES.rtl : STORYBOOK_CACHES.ltr;

  const themeContextValue = useMemo(
    () => ({
      mode: themeMode,
      toggleTheme: () => {},
      isThemeChanging: false,
      setIsThemeChanging: () => {},
    }),
    [themeMode]
  );

  useEffect(() => {
    seedStorybookAdminUser();
  }, []);

  const isUiComponent = checkIsUiComponent(context);

  const content = <RenderStory Story={Story} context={context} />;

  return (
    <LocaleProvider locale={locale}>
      <ThemeContext.Provider value={themeContextValue}>
        <CacheProvider value={cache}>
          <ThemeProvider
            theme={theme}
            defaultMode={themeMode}
            forceThemeRerender
            // Isolate from the app's `theme` localStorage key so Storybook toolbar
            // controls the active palette instead of a persisted app preference.
            modeStorageKey="sb-theme"
          >
            <CssBaseline />
            <StorybookColorSchemeBridge mode={themeMode} direction={direction} locale={locale}>
              <StoryGlobalStyles />
              <ViewportProvider>
                <StoryCanvas isUiComponent={isUiComponent} viewport={viewport}>
                  {content}
                </StoryCanvas>
              </ViewportProvider>
            </StorybookColorSchemeBridge>
          </ThemeProvider>
        </CacheProvider>
      </ThemeContext.Provider>
    </LocaleProvider>
  );
};

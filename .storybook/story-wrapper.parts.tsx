import { Box, GlobalStyles, type PaletteMode } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import type { StoryContext, StoryFn } from "@storybook/nextjs-vite";
import { type ReactNode, useEffect } from "react";
import { VIEWPORT_MAX_WIDTH, type ViewportGlobal } from "./story-wrapper.constants";

/**
 * Syncs Storybook's `theme` global to MUI's `useColorScheme()` and the DOM
 * attributes that scope CSS variable palettes (`data-theme`, `data-mui-color-scheme`).
 */
export function StorybookColorSchemeBridge({
  mode,
  direction,
  locale,
  children,
}: Readonly<{
  mode: PaletteMode;
  direction: "rtl" | "ltr";
  locale: "ar" | "en";
  children: ReactNode;
}>) {
  const { setMode } = useColorScheme();

  useEffect(() => {
    setMode(mode);
  }, [mode, setMode]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = mode;
    root.dataset.muiColorScheme = mode;
    root.style.colorScheme = mode;
    root.dir = direction;
    root.lang = locale;
  }, [mode, direction, locale]);

  return children;
}

/** Documentation-surface overrides kept in sync with the active palette. */
export function StoryGlobalStyles() {
  return (
    <GlobalStyles
      styles={muiTheme => ({
        ".sbdocs-wrapper": {
          maxWidth: "100% !important",
          padding: "2rem !important",
          backgroundColor: `${muiTheme.palette.background.default} !important`,
        },
        ".sbdocs-preview, .docs-story, .innerZoomElementWrapper, .docs-story > div, .sbdocs [role='toolbar']": {
          backgroundColor: `${muiTheme.palette.background.default} !important`,
          borderColor: `${muiTheme.palette.divider} !important`,
          color: `${muiTheme.palette.text.primary} !important`,
        },
        ".sbdocs-content": {
          maxWidth: "100% !important",
          width: "100% !important",
        },
        ".sbdocs-title, .sbdocs-h1, .sbdocs-h2, .sbdocs-h3": {
          color: `${muiTheme.palette.text.primary} !important`,
        },
        ".sbdocs-p, .sbdocs-li, .sbdocs-a": {
          color: `${muiTheme.palette.text.secondary} !important`,
        },
        ".sbdocs button, .sbdocs a, .sbdocs [role='toolbar'] button": {
          color: `${muiTheme.palette.text.primary} !important`,
        },
      })}
    />
  );
}

/** Centers UI-component stories and clamps their width to the active viewport global. */
export function StoryCanvas({
  isUiComponent,
  viewport,
  children,
}: Readonly<{ isUiComponent: boolean; viewport: ViewportGlobal; children: ReactNode }>) {
  const maxWidth = VIEWPORT_MAX_WIDTH[viewport];

  return isUiComponent ? (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        width: "100%",
        padding: 4,
        boxSizing: "border-box",
        maxWidth: maxWidth === "none" ? "100%" : maxWidth,
        mx: "auto",
      }}
    >
      {children}
    </Box>
  ) : (
    children
  );
}

/**
 * A small helper component to render the story function.
 * This ensures that hooks called within the story are executed
 * within a child component's render cycle, properly inheriting
 * context from providers in StoryWrapper.
 */
export function RenderStory({ Story, context }: Readonly<{ Story: StoryFn; context: StoryContext }>) {
  return <>{Story(context.args, context)}</>;
}

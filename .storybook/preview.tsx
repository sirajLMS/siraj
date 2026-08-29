// cspell:ignore circlehollow
import { DocsContainer, type DocsContainerProps } from "@storybook/addon-docs/blocks";
import type { Decorator, Preview } from "@storybook/react";
import { setupWorker } from "msw/browser";
import { mswLoader } from "msw-storybook-addon/csf3";
import { type PropsWithChildren, useEffect, useState } from "react";
import { GLOBALS_UPDATED } from "storybook/internal/core-events";
import { addons } from "storybook/preview-api";
import { themes } from "storybook/theming";
import { mswHandlers } from "./msw-handlers";
import { StoryWrapper } from "./StoryWrapper";

// Import global styles
import "@/app/index.css";

type DocsThemeMode = "light" | "dark";

function getInitialDocsMode(): DocsThemeMode {
  // The story `theme` global travels in the preview iframe URL query string.
  const frameGlobals = new URLSearchParams(window.location.search).get("globals");
  const themeEntry = frameGlobals?.split(";").find(entry => entry.startsWith("theme:"));
  const frameTheme = themeEntry?.split(":")[1];
  if (frameTheme === "light" || frameTheme === "dark") {
    return frameTheme;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Docs pages render independently from the manager theme (and default to light), which
 * left the docs surface white inside a dark Storybook UI. Theming the docs container
 * from the story `theme` global keeps docs in sync with the canvas and its toolbar toggle.
 */
function ThemedDocsContainer({ children, context }: PropsWithChildren<DocsContainerProps>) {
  const [mode, setMode] = useState<DocsThemeMode>(getInitialDocsMode);
  useEffect(() => {
    // `useChannel` only works inside story render contexts; docs containers subscribe directly.
    const onGlobalsUpdated = ({ globals }: { globals: Record<string, unknown> }) => {
      if (globals.theme === "light" || globals.theme === "dark") {
        setMode(globals.theme);
      }
    };
    const channel = addons.getChannel();
    channel.on(GLOBALS_UPDATED, onGlobalsUpdated);
    return () => channel.off(GLOBALS_UPDATED, onGlobalsUpdated);
  }, []);
  return (
    <DocsContainer context={context} theme={mode === "dark" ? themes.dark : themes.light}>
      {children}
    </DocsContainer>
  );
}

const withAllProviders: Decorator = (Story, context) => <StoryWrapper Story={Story} context={context} />;

const preview: Preview = {
  initialGlobals: {
    locale: "ar",
    theme: "dark",
    viewport: "desktop",
  },
  globalTypes: {
    locale: {
      description: "Internationalization locale",
      defaultValue: "ar",
      toolbar: {
        icon: "globe",
        items: [
          { value: "en", right: "🇺🇸", title: "English" },
          { value: "ar", right: "🇦🇪", title: "Arabic" },
        ],
      },
    },
    theme: {
      description: "Global theme for components",
      defaultValue: "dark",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "light", icon: "circlehollow", title: "Light" },
          { value: "dark", icon: "circle", title: "Dark" },
        ],
      },
    },
    viewport: {
      description: "Viewport breakpoint for previewing responsive layouts",
      defaultValue: "desktop",
      toolbar: {
        icon: "browser",
        items: [
          { value: "mobile", icon: "mobile", title: "Mobile" },
          { value: "tablet", icon: "tablet", title: "Tablet" },
          { value: "desktop", icon: "browser", title: "Desktop" },
        ],
      },
    },
  },
  loaders: [
    mswLoader(async () => {
      const worker = setupWorker();
      await worker.start({ onUnhandledRequest: "bypass" });
      return worker;
    }),
  ],
  parameters: {
    msw: { handlers: mswHandlers },

    docs: { container: ThemedDocsContainer },

    nextjs: {
      appDirectory: true,
    },

    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      test: "todo",
    },
  },
  decorators: [withAllProviders],
};

export default preview;

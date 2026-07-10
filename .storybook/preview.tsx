// cspell:ignore circlehollow
import type { Decorator, Preview } from "@storybook/react";
import { initialize, mswLoader } from "msw-storybook-addon";
import { mswHandlers } from "@/../.storybook/msw-handlers";
import { StoryWrapper } from "@/../.storybook/StoryWrapper";

// Import global styles
import "@/app/index.css";

// Initialize MSW
initialize({ onUnhandledRequest: "bypass" });

const withAllProviders: Decorator = (Story, context) => <StoryWrapper Story={Story} context={context} />;

const preview: Preview = {
  initialGlobals: {
    locale: "ar",
    theme: "dark",
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
  },
  loaders: [mswLoader],
  parameters: {
    msw: { handlers: mswHandlers },

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
      // eslint-disable-next-line sonarjs/todo-tag
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
  },
  decorators: [withAllProviders],
};

export default preview;

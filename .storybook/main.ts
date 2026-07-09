import path from "node:path";
import type { StorybookConfig } from "@storybook/nextjs-vite";
import { mergeConfig } from "vite";

const config: StorybookConfig = {
  stories: ["../frontend/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-mcp",
    "@storybook/addon-themes",
  ],
  framework: "@storybook/nextjs-vite",
  staticDirs: ["../public"],
  async viteFinal(config) {
    return mergeConfig(config, {
      resolve: {
        alias: {
          "react-leaflet/package.json": path.resolve("node_modules/react-leaflet/package.json"),
          "@react-leaflet/core/package.json": path.resolve("node_modules/@react-leaflet/core/package.json"),
        },
      },
      optimizeDeps: {
        exclude: ["react-leaflet", "@react-leaflet/core"],
      },
    });
  },
};
export default config;

import path from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/nextjs-vite";
import { mergeConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ["../frontend/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-mcp",
    "msw-storybook-addon",
  ],
  framework: "@storybook/nextjs-vite",
  staticDirs: ["../public"],
  async viteFinal(cfg) {
    return mergeConfig(cfg, {
      resolve: {
        alias: {
          "react-leaflet/package.json": path.resolve("node_modules/react-leaflet/package.json"),
          "@react-leaflet/core/package.json": path.resolve("node_modules/@react-leaflet/core/package.json"),
          "@": path.resolve(__dirname, ".."),
        },
      },
      optimizeDeps: {
        exclude: ["react-leaflet", "@react-leaflet/core"],
      },
    });
  },
};
export default config;

import path from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/nextjs-vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ["../frontend/**/*.mdx", "../frontend/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-mcp",
    "@storybook/addon-themes",
  ],
  framework: "@storybook/nextjs-vite",
  staticDirs: ["..\\public"], //NoSonar
  async viteFinal(config) {
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@/frontend/stores/userStore": path.resolve(__dirname, "../frontend/stores/mockUserStore"),
        "../stores/userStore": path.resolve(__dirname, "../frontend/stores/mockUserStore"),
      };
    }
    return config;
  },
};
export default config;

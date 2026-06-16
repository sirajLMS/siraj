/* eslint-disable no-console */
const isDev = process.env.NODE_ENV !== "production";

export const logger = {
  info: (...args: unknown[]) => {
    if (isDev) {
      console.info("[INFO]", ...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn("[WARN]", ...args);
    }
  },
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.debug("[DEBUG]", ...args);
    }
  },
  error: (...args: unknown[]) => {
    console.error("[ERROR]", ...args);
  },
};

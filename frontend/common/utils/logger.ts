const isDev = process.env.NODE_ENV !== "production";

export const logger = {
  info: (...args: unknown[]) => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.info("[INFO]", ...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.warn("[WARN]", ...args);
    }
  },
  debug: (...args: unknown[]) => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.debug("[DEBUG]", ...args);
    }
  },
  error: (...args: unknown[]) => {
    if (isDev) {
      // In development, log full error details for debugging
      // eslint-disable-next-line no-console
      console.error("[ERROR]", ...args);
    } else {
      // In production, log limited info to avoid exposing PII in error objects
      const sanitized = args.map(arg => {
        if (arg instanceof Error) {
          return `[ERROR] ${arg.name}: ${arg.message}`;
        }
        if (typeof arg === "string") {
          return arg;
        }
        return "[redacted]";
      });
      // eslint-disable-next-line no-console
      console.error(...sanitized);
    }
  },
};

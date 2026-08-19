export async function register() {
  // Env validation uses Node APIs (fs, path, crypto via logger/env).
  // Next.js still analyzes instrumentation for Edge — gate the import.
  // https://nextjs.org/docs/app/guides/instrumentation#importing-runtime-specific-code
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureEnvironmentValidated } = await import("./backend/lib/env");
    ensureEnvironmentValidated();

    // Load New Relic agent in production only (AC-1, AC-6).
    // The agent module is never loaded in dev/test — loadNewRelicAgent()
    // gates on NODE_ENV === 'production' and uses dynamic import('newrelic').
    if (process.env.NODE_ENV === "production") {
      try {
        const { loadNewRelicAgent } = await import("./backend/lib/newrelic-agent");
        await loadNewRelicAgent();
      } catch (error) {
        // Agent failure must NOT block server startup.
        const { logger } = await import("./backend/lib/logger");
        logger.error("Failed to load New Relic agent during instrumentation", error);
      }
    }
  }
}

import { logger } from "@/backend/lib/logger";

/**
 * Minimal type for the New Relic agent's internal event emitter.
 * The `@types/newrelic` package doesn't expose the `agent` property on the
 * public API, but the runtime API object does have it (see `newrelic/api.js`).
 */
interface NewRelicAgent {
  on(event: "started" | "errored", listener: (error?: Error) => void): void;
}

interface NewRelicModule {
  agent: NewRelicAgent;
}

/**
 * Type guard: the `@types/newrelic` package doesn't expose the `agent`
 * property, but the runtime API object has it (see `newrelic/api.js`).
 */
function hasAgent(value: unknown): value is NewRelicModule {
  return (
    typeof value === "object" &&
    value !== null &&
    "agent" in value &&
    typeof (value as Record<string, unknown>).agent === "object" &&
    (value as Record<string, unknown>).agent !== null
  );
}

function unwrapModule(mod: unknown): unknown {
  if (typeof mod === "object" && mod !== null && "default" in mod) {
    return mod.default;
  }
  return mod;
}

let loadedNewRelic: typeof import("newrelic") | undefined;

/**
 * Returns the loaded New Relic module instance if active, or `undefined` in dev/test/non-Node environments.
 */
export function getNewRelicAgent(): typeof import("newrelic") | undefined {
  return loadedNewRelic;
}

/**
 * Dynamically loads the New Relic agent in production Node.js runtime.
 *
 * The agent is only loaded when:
 * - `NODE_ENV` is `production`
 * - `NEXT_RUNTIME` is `nodejs`
 *
 * Waits up to 8 seconds for the agent to connect before continuing.
 * Returns the `newrelic` module instance, or `undefined` if not loaded/failed.
 */
export async function loadNewRelicAgent(): Promise<typeof import("newrelic") | undefined> {
  if (process.env.NODE_ENV !== "production" || process.env.NEXT_RUNTIME !== "nodejs") {
    return undefined;
  }

  try {
    const rawImport = await import("newrelic");
    const newrelicModule = unwrapModule(rawImport);
    loadedNewRelic = rawImport;

    if (!hasAgent(newrelicModule)) {
      logger.error("New Relic module loaded but agent property is missing");
      return undefined;
    }

    const { agent } = newrelicModule;

    await new Promise<void>(resolve => {
      let settled = false;

      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          logger.warn("New Relic agent connection timed out after 8s — continuing without telemetry");
          resolve();
        }
      }, 8000);

      agent.on("started", () => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          logger.info("New Relic agent connected");
          resolve();
        }
      });

      agent.on("errored", (error?: Error) => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          logger.error("New Relic agent failed to connect", error);
          resolve();
        }
      });
    });

    return rawImport;
  } catch (error) {
    logger.error("Failed to load New Relic agent", error);
    return undefined;
  }
}

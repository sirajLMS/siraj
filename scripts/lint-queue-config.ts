/**
 * Lint Queue Configuration — Shared Port & URL Constants
 *
 * This is the SINGLE source of truth for the lint queue server port.
 * Both `lint-queue-server.ts` and `lint-queue-client.ts` (and any other
 * script that needs to talk to the lint queue) MUST import from here —
 * no hardcoded port numbers anywhere else.
 *
 * Override order (highest priority first):
 *   1. `LINT_QUEUE_PORT` environment variable
 *   2. The `LINT_QUEUE_PORT` constant defined below
 *
 * To change the port for all scripts, edit the constant below.
 * To change it for a single run, set the env var:
 *   LINT_QUEUE_PORT=5000 bun run scripts/lint-queue-server.ts
 */

/** Default port for the lint queue server. Change this to change everywhere. */
export const LINT_QUEUE_PORT = 4777;

/** Resolved port: env var takes precedence over the default constant. */
export const PORT: number = Number(process.env.LINT_QUEUE_PORT ?? LINT_QUEUE_PORT);

/** Base URL for HTTP requests to the lint queue server. */
export const BASE_URL: string = `http://localhost:${PORT}`;

/** Status endpoint URL. */
export const STATUS_URL: string = `${BASE_URL}/status`;

/** Lint endpoint URL. */
export const LINT_URL: string = `${BASE_URL}/lint`;

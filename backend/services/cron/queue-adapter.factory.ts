/**
 * Queue Adapter Factory — resolves the active queue adapter from env / system_settings.
 *
 * Resolution order:
 *  1. `resolveEnvConfig("CRON_QUEUE_BACKEND")` (DB-overridable, 5min TTL cache)
 *  2. `process.env.CRON_QUEUE_BACKEND`
 *  3. Default: `PG_BOSS`
 *
 * The matching adapter module is imported lazily via `await import(...)` so that
 * optional dependencies (pg-boss, bullmq) are only loaded when their backend is active.
 * Import paths are static strings for bundler analysis.
 */

import { CronQueueBackend } from "@/backend/enum/cron/cron.enums";
import { resolveEnvConfig } from "@/backend/lib/env-config-resolver";
import logger from "@/backend/lib/logger";
import {
  type CronQueueAdapter,
  CronQueueBackendNotAvailable,
  CronQueueBackendUnknown,
} from "@/backend/types/cron/cron.types";

const BACKEND_TTL_MS = 5 * 60 * 1000; // 5 minutes

let activeAdapter: CronQueueAdapter | null = null;
let activeBackend: CronQueueBackend | null = null;
let activeBackendResolvedAt = 0;

function mapToBackend(value: string | undefined): CronQueueBackend {
  if (!value) return CronQueueBackend.PG_BOSS;
  const normalized = value.toUpperCase().replace(/-/g, "_");
  const values = Object.values(CronQueueBackend) as string[];
  if (!values.includes(normalized)) {
    throw new CronQueueBackendUnknown(value);
  }
  return normalized as CronQueueBackend;
}

/**
 * Resolve the active queue backend.
 * Cached with a 5-minute TTL; re-resolves from env config after expiry.
 * If the backend changes after TTL expiry, the cached adapter is invalidated.
 */
export async function resolveQueueBackend(): Promise<CronQueueBackend> {
  const now = Date.now();
  if (activeBackend && now - activeBackendResolvedAt < BACKEND_TTL_MS) {
    return activeBackend;
  }
  const envValue = await resolveEnvConfig("CRON_QUEUE_BACKEND");
  const newBackend = mapToBackend(envValue ?? process.env.CRON_QUEUE_BACKEND);
  if (activeBackend && newBackend !== activeBackend) {
    logger.info("cron.queue.factory.backendChanged", { from: activeBackend, to: newBackend });
    activeAdapter = null; // Force re-initialization with new backend
  }
  activeBackend = newBackend;
  activeBackendResolvedAt = now;
  logger.info("cron.queue.factory.resolved", { backend: activeBackend });
  return activeBackend;
}

/**
 * Get the active queue adapter singleton.
 * Calls `init()` on first access.
 */
export async function getQueueAdapter(): Promise<CronQueueAdapter> {
  await resolveQueueBackend();

  if (activeAdapter) return activeAdapter;

  if (!activeBackend) {
    throw new CronQueueBackendNotAvailable("Queue backend not resolved");
  }

  const backend = activeBackend;

  switch (backend) {
    case CronQueueBackend.PG_BOSS:
      activeAdapter = await loadPgBossAdapter();
      break;
    case CronQueueBackend.BULLMQ_POSTGRES:
      activeAdapter = await loadBullMQPgAdapter();
      break;
    case CronQueueBackend.BULLMQ_REDIS:
      activeAdapter = await loadBullMQRedisAdapter();
      break;
    case CronQueueBackend.CUSTOM_SQL:
      activeAdapter = await loadCustomSqlAdapter();
      break;
    default:
      throw new CronQueueBackendNotAvailable(`backend "${backend}" has no adapter implementation`);
  }

  await activeAdapter.init();
  return activeAdapter;
}

/**
 * Reset the factory — used for testing.
 */
export function resetQueueAdapterFactory(): void {
  activeAdapter = null;
  activeBackend = null;
  activeBackendResolvedAt = 0;
}

// ── Lazy adapter loaders (static import paths for bundler analysis) ──

async function loadPgBossAdapter(): Promise<CronQueueAdapter> {
  const mod = await import("@/backend/services/cron/queue-adapters/pgboss.adapter");
  return mod.createPgBossAdapter();
}

async function loadBullMQPgAdapter(): Promise<CronQueueAdapter> {
  const mod = await import("@/backend/services/cron/queue-adapters/bullmq-pg.adapter");
  return mod.createBullMQPgAdapter();
}

async function loadBullMQRedisAdapter(): Promise<CronQueueAdapter> {
  const mod = await import("@/backend/services/cron/queue-adapters/bullmq-redis.adapter");
  return mod.createBullMQRedisAdapter();
}

async function loadCustomSqlAdapter(): Promise<CronQueueAdapter> {
  const mod = await import("@/backend/services/cron/queue-adapters/custom-sql.adapter");
  return mod.createCustomSqlAdapter();
}

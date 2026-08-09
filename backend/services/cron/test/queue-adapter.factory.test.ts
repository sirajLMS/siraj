import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { CronQueueBackend } from "@/backend/enum/cron/cron.enums";
import {
  getQueueAdapter,
  resetQueueAdapterFactory,
  resolveQueueBackend,
} from "@/backend/services/cron/queue-adapter.factory";

// ── Mock resolveEnvConfig so tests don't touch the DB ──
// Default mock returns undefined (no DB override) so the factory falls through to process.env.
let envConfigResult: string | undefined;
await mock.module("@/backend/services/system", () => ({
  resolveEnvConfig: () => envConfigResult,
}));

afterEach(() => {
  resetQueueAdapterFactory();
  delete process.env.CRON_QUEUE_BACKEND;
});

describe("queue-adapter.factory", () => {
  beforeEach(() => {
    resetQueueAdapterFactory();
    delete process.env.CRON_QUEUE_BACKEND;
    envConfigResult = undefined;
  });

  test("resolveQueueBackend defaults to PG_BOSS when no env is set", async () => {
    delete process.env.CRON_QUEUE_BACKEND;
    const backend = await resolveQueueBackend();
    expect(backend).toBe(CronQueueBackend.PG_BOSS);
  });

  test("resolveQueueBackend reads from process.env.CRON_QUEUE_BACKEND", async () => {
    process.env.CRON_QUEUE_BACKEND = "CUSTOM_SQL";
    const backend = await resolveQueueBackend();
    expect(backend).toBe(CronQueueBackend.CUSTOM_SQL);
  });

  test("resolveQueueBackend normalizes hyphens to underscores", async () => {
    process.env.CRON_QUEUE_BACKEND = "custom-sql";
    const backend = await resolveQueueBackend();
    expect(backend).toBe(CronQueueBackend.CUSTOM_SQL);
  });

  test("resolveQueueBackend normalizes case", async () => {
    process.env.CRON_QUEUE_BACKEND = "pg_boss";
    const backend = await resolveQueueBackend();
    expect(backend).toBe(CronQueueBackend.PG_BOSS);
  });

  test("resolveQueueBackend throws CronQueueBackendUnknown for unknown backend", async () => {
    process.env.CRON_QUEUE_BACKEND = "rabbitmq";
    try {
      await resolveQueueBackend();
      throw new Error("should have thrown");
    } catch (error) {
      const { CronQueueBackendUnknown } = await import("@/backend/types/cron/cron.types");
      expect(error).toBeInstanceOf(CronQueueBackendUnknown);
      if (error instanceof Error) {
        expect(error.name).toBe("CronQueueBackendUnknown");
      }
    }
  });

  test("resolveQueueBackend caches the backend selection", async () => {
    process.env.CRON_QUEUE_BACKEND = "CUSTOM_SQL";
    const first = await resolveQueueBackend();
    process.env.CRON_QUEUE_BACKEND = "PG_BOSS";
    const second = await resolveQueueBackend();
    expect(first).toBe(second);
    expect(first).toBe(CronQueueBackend.CUSTOM_SQL);
  });

  test("resolveEnvConfig takes precedence over process.env for backend resolution", async () => {
    process.env.CRON_QUEUE_BACKEND = "PG_BOSS";
    envConfigResult = "BULLMQ_REDIS"; // DB override should win over process.env
    const backend = await resolveQueueBackend();
    expect(backend).toBe(CronQueueBackend.BULLMQ_REDIS);
  });

  test("getQueueAdapter throws CronQueueBackendNotAvailable when bullmq import fails", async () => {
    // Force resolveQueueBackend to select BULLMQ_POSTGRES
    envConfigResult = "BULLMQ_POSTGRES";
    try {
      await getQueueAdapter();
      throw new Error("should have thrown");
    } catch (error) {
      const { CronQueueBackendNotAvailable } = await import("@/backend/types/cron/cron.types");
      expect(error).toBeInstanceOf(CronQueueBackendNotAvailable);
      if (error instanceof Error) {
        expect(error.name).toBe("CronQueueBackendNotAvailable");
      }
    }
  });
});

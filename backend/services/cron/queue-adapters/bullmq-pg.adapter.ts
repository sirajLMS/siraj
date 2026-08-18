import { createBullMQStub } from "@/backend/services/cron/queue-adapters/bullmq-shared";
import type { CronQueueAdapter } from "@/backend/types";

export async function createBullMQPgAdapter(): Promise<CronQueueAdapter> {
  return createBullMQStub("Postgres");
}

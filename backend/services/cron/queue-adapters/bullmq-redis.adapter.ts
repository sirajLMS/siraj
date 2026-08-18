import { createBullMQStub } from "@/backend/services/cron/queue-adapters/bullmq-shared";
import type { CronQueueAdapter } from "@/backend/types";

export async function createBullMQRedisAdapter(): Promise<CronQueueAdapter> {
  return createBullMQStub("Redis");
}

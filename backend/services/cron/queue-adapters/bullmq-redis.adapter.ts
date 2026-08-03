import { createBullMQStub } from "@/backend/services/cron/queue-adapters/bullmq-shared";

export async function createBullMQRedisAdapter(): Promise<import("@/backend/types/cron/cron.types").CronQueueAdapter> {
  return createBullMQStub("Redis");
}

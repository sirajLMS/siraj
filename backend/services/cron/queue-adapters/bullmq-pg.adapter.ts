import { createBullMQStub } from "@/backend/services/cron/queue-adapters/bullmq-shared";

export async function createBullMQPgAdapter(): Promise<import("@/backend/types/cron/cron.types").CronQueueAdapter> {
  return createBullMQStub("Postgres");
}

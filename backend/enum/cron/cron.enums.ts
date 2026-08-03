export enum CronQueueBackend {
  PG_BOSS = "PG_BOSS",
  BULLMQ_POSTGRES = "BULLMQ_POSTGRES",
  BULLMQ_REDIS = "BULLMQ_REDIS",
  CUSTOM_SQL = "CUSTOM_SQL",
}

export enum CronScheduleStatus {
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  DISABLED = "DISABLED",
}

export enum CronRunStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  TIMEOUT = "TIMEOUT",
  CANCELLED = "CANCELLED",
  RETRYING = "RETRYING",
}

export enum CronJobKind {
  NOOP = "NOOP",
}

export enum CronTriggerSource {
  VERCEL_TICKER = "VERCEL_TICKER",
  VERCEL_EXPLICIT = "VERCEL_EXPLICIT",
  EXTERNAL = "EXTERNAL",
  MANUAL = "MANUAL",
  WORKER_RETRY = "WORKER_RETRY",
}

export enum CronConcurrencyPolicy {
  ALLOW = "ALLOW",
  SKIP = "SKIP",
  REPLACE = "REPLACE",
}

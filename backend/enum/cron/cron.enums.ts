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

const cronConcurrencyPolicyValues = Object.values(CronConcurrencyPolicy) as readonly CronConcurrencyPolicy[];
const cronConcurrencyPolicyStrings = cronConcurrencyPolicyValues as readonly string[];

/**
 * Type guard to check if a string is a valid CronConcurrencyPolicy.
 */
export function isCronConcurrencyPolicy(value: string): value is CronConcurrencyPolicy {
  return cronConcurrencyPolicyStrings.includes(value);
}

/**
 * Parses a string value into a CronConcurrencyPolicy enum, returning null if invalid.
 */
export function parseCronConcurrencyPolicy(value: string | null | undefined): CronConcurrencyPolicy | null {
  if (value == null) {
    return null;
  }
  if (isCronConcurrencyPolicy(value)) {
    return value;
  }
  return null;
}

const cronJobKindStrings = Object.values(CronJobKind) as readonly string[];
const cronScheduleStatusStrings = Object.values(CronScheduleStatus) as readonly string[];
const cronRunStatusStrings = Object.values(CronRunStatus) as readonly string[];
const cronTriggerSourceStrings = Object.values(CronTriggerSource) as readonly string[];

/**
 * Type guard to check if a string is a valid CronJobKind.
 */
export function isCronJobKind(value: string): value is CronJobKind {
  return cronJobKindStrings.includes(value);
}

/**
 * Type guard to check if a string is a valid CronScheduleStatus.
 */
export function isCronScheduleStatus(value: string): value is CronScheduleStatus {
  return cronScheduleStatusStrings.includes(value);
}

/**
 * Type guard to check if a string is a valid CronRunStatus.
 */
export function isCronRunStatus(value: string): value is CronRunStatus {
  return cronRunStatusStrings.includes(value);
}

/**
 * Type guard to check if a string is a valid CronTriggerSource.
 */
export function isCronTriggerSource(value: string): value is CronTriggerSource {
  return cronTriggerSourceStrings.includes(value);
}

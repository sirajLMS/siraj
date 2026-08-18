import { type CronJobKind, isCronJobKind } from "@/backend/enum";

/** Thrown when a queue backend name doesn't match any known adapter. */
export class CronQueueBackendUnknown extends Error {
  constructor(backend: string) {
    super(`CronQueueBackendUnknown: Unknown queue backend "${backend}"`);
    this.name = "CronQueueBackendUnknown";
  }
}

/** Thrown when a queue backend is known but its adapter is unavailable. */
export class CronQueueBackendNotAvailable extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CronQueueBackendNotAvailable";
  }
}

/**
 * Runtime guard: validates that a raw string is a `CronJobKind` enum member,
 * throws otherwise. Uses the canonical `isCronJobKind` from `@/backend/enum`.
 */
export function safeCronJobKind(value: string): CronJobKind {
  if (isCronJobKind(value)) {
    return value;
  }
  throw new Error(`Invalid CronJobKind: "${value}"`);
}

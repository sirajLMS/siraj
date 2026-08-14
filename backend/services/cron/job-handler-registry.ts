/**
 * Job Handler Registry — maps `CronJobKind` → handler at boot.
 *
 * Handlers are stateless functions registered once and invoked by the worker runtime.
 *
 * **IDEMPOTENCY CONTRACT**: Handlers MUST be idempotent. The queue delivers jobs
 * at-least-once — under failure/retry scenarios the same `CronJobPayload` may be
 * delivered more than once. Handlers MUST safely handle duplicate execution
 * (e.g. use deduplication keys, check-before-write, or natural idempotency).
 * Future plan implementers rely on this contract.
 */
import { CronJobKind } from "@/backend/enum/cron/cron.enums";
import type { CronJobHandler, CronJobPayload, CronJobResult } from "@/backend/types";

const registry = new Map<CronJobKind, CronJobHandler>();

// ── Built-in NOOP handler ──

async function noopHandler(_job: CronJobPayload): Promise<CronJobResult> {
  return { success: true };
}

/**
 * Initialize the registry with the built-in NOOP handler.
 * Called once on module load, but safe to call multiple times.
 */
export function registerCoreHandlers(): void {
  registry.set(CronJobKind.NOOP, noopHandler);
}

// Auto-register on module load
registerCoreHandlers();

/**
 * Register a handler for a `CronJobKind`.
 */
export function registerHandler(kind: CronJobKind, handler: CronJobHandler): void {
  registry.set(kind, handler);
}

/**
 * Get the handler for a `CronJobKind`, or `null` if none registered.
 */
export function getHandler(kind: CronJobKind): CronJobHandler | null {
  return registry.get(kind) ?? null;
}

/**
 * Get all registered job kinds.
 */
export function getRegisteredKinds(): CronJobKind[] {
  return [...registry.keys()];
}

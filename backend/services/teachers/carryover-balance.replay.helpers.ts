import { AuditRepository } from "@/backend/db/repo";
import { isAuditMetadataRecord, readAuditMetadataKey } from "@/backend/services/shared";
import { AuditService } from "@/backend/services/system/audit.service";
import {
  CURRENCY_BY_VALUE,
  IDEMPOTENCY_WINDOW_SECONDS,
  REPLAY_LOOKUP_MAX_PAGES,
  REPLAY_LOOKUP_PAGE_SIZE,
} from "@/backend/services/teachers/carryover-balance.constants";
import type {
  AuditAction,
  AuditLogReturnType,
  BulkCreateCarryoverGroupResult,
  BulkToExpenseItemResult,
  CreateAuditLogInput,
  DBTransaction,
} from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.every(element => typeof element === "string") ? value : null;
}

function readCurrency(value: unknown): CurrencyCode | null {
  if (typeof value !== "string") return null;
  return CURRENCY_BY_VALUE.get(value) ?? null;
}

/** Pages the actor's audit window into `collected`, deduping by log id; recursion keeps the sequential reads lint-clean. */
async function scanAuditWindowPages(
  tx: DBTransaction,
  actorUserId: string,
  action: AuditAction,
  windowStart: Date,
  collected: Map<string, AuditLogReturnType>,
  offset: number,
  page: number
): Promise<void> {
  if (page >= REPLAY_LOOKUP_MAX_PAGES) return;
  const result = await AuditRepository.queryAuditLogs(
    { actorUserId, action, startDate: windowStart, limit: REPLAY_LOOKUP_PAGE_SIZE, offset },
    tx
  );
  if (result.logs.length === 0) return;
  for (const log of result.logs) {
    collected.set(log.id, log);
  }
  if (collected.size >= result.total) return;
  await scanAuditWindowPages(tx, actorUserId, action, windowStart, collected, offset + result.logs.length, page + 1);
}

/**
 * Finds audit rows matching the replay key for one actor + action inside the
 * idempotency window, newest first. The lookup pages through the whole actor
 * window (a bulk batch can emit up to 500 audit rows, above any single page),
 * deduping by log id to survive concurrent front-of-window inserts shifting
 * pages, and sorts the matches deterministically so the reconstructed replay
 * never depends on page boundaries.
 */
export async function findReplayAuditLogs(
  tx: DBTransaction,
  actorUserId: string,
  action: AuditAction,
  idempotencyKey: string
): Promise<AuditLogReturnType[]> {
  const windowStart = new Date(Date.now() - IDEMPOTENCY_WINDOW_SECONDS * 1000);
  const collected = new Map<string, AuditLogReturnType>();
  await scanAuditWindowPages(tx, actorUserId, action, windowStart, collected, 0, 0);
  return [...collected.values()]
    .filter(log => readAuditMetadataKey(log.metadata) === idempotencyKey)
    .toSorted(compareAuditLogsForReplay);
}

/** Newest first, with the id tiebreak keeping ties (one bulk batch shares a timestamp) deterministic. */
function compareAuditLogsForReplay(a: AuditLogReturnType, b: AuditLogReturnType): number {
  const byTime = b.createdAt.getTime() - a.createdAt.getTime();
  if (byTime !== 0) return byTime;
  if (a.id === b.id) return 0;
  return a.id < b.id ? 1 : -1;
}

export function parseReplayGroup(log: AuditLogReturnType): BulkCreateCarryoverGroupResult | null {
  const metadata = log.metadata;
  if (!isAuditMetadataRecord(metadata)) return null;
  const teacherId = readString(metadata.teacherId);
  const studentsCount = readNumber(metadata.studentsCount);
  const totalDuration = readString(metadata.totalDuration);
  const payable = readString(metadata.payable);
  const currency = readCurrency(metadata.currency);
  const instanceIds = readStringArray(metadata.instanceIds);
  if (teacherId == null || studentsCount == null || totalDuration == null || payable == null) return null;
  if (currency == null || instanceIds == null) return null;
  return { teacherId, carryoverId: log.entityId, studentsCount, totalDuration, payable, currency, instanceIds };
}

export function parseReplayExpenseItem(log: AuditLogReturnType): BulkToExpenseItemResult | null {
  const metadata = log.metadata;
  if (!isAuditMetadataRecord(metadata)) return null;
  const expenseId = readString(metadata.expenseId);
  const amount = readString(metadata.amount);
  const currency = readCurrency(metadata.currency);
  if (expenseId == null || amount == null || currency == null) return null;
  return { carryoverId: log.entityId, expenseId, amount, currency };
}

async function emitCarryoverAuditLogs(tx: DBTransaction, inputs: CreateAuditLogInput[]): Promise<string[]> {
  const inserted = await AuditService.createManyAuditLogs(inputs, tx);
  return inserted.map(log => log.id);
}

export async function emitCarryoverAuditLog(tx: DBTransaction, input: CreateAuditLogInput): Promise<string | null> {
  const ids = await emitCarryoverAuditLogs(tx, [input]);
  return ids[0] ?? null;
}

import { BillingRepository, CarryoverBalanceRepository, TeacherRepository } from "@/backend/db/repo";
import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { acquireAdvisoryLock } from "@/backend/db/repo/shared";
import { CalculationStatus } from "@/backend/enum";
import { DomainError, logger, NotFoundError } from "@/backend/lib";
import {
  computeTotalDurationHours,
  groupInstancesByTeacher,
  maxDate,
  minDate,
  resolveDominantCurrency,
} from "@/backend/services/teachers/carryover-aggregate";
import {
  CARRYOVER_ACTION_CREATE,
  CARRYOVER_AUDIT_ENTITY_TYPE,
  DEFAULT_AGGREGATE_CURRENCY,
  ZERO_AMOUNT,
} from "@/backend/services/teachers/carryover-balance.constants";
import {
  convertAmountWithRate,
  formatAmountMinorUnits,
  toAmountMinorUnits,
} from "@/backend/services/teachers/carryover-balance.money.helpers";
import {
  emitCarryoverAuditLog,
  findReplayAuditLogs,
  parseReplayGroup,
} from "@/backend/services/teachers/carryover-balance.replay.helpers";
import { buildStudentsSummary } from "@/backend/services/teachers/carryover-balance.rows.helpers";
import { forEachInSequence, mapInSequence } from "@/backend/services/teachers/carryover-balance.sequence.helpers";
import { transitionSessions } from "@/backend/services/teachers/carryover-balance.sessions.helpers";
import {
  assertAllInstancesFound,
  validateInstancesForCarryover,
} from "@/backend/services/teachers/carryover-balance.validation.helpers";
import type {
  AuditLogReturnType,
  BulkCreateCarryoverGroupResult,
  BulkCreateCarryoverInput,
  BulkCreateCarryoverResult,
  CarryoverItemDraft,
  ClassInstanceSelectType,
  DBTransaction,
  GroupCreationOutcome,
  PreparedGroupCarryover,
} from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import type { ErrorsLabels } from "@/shared/locale";

/**
 * Resolves the latest exchange rate for a cross-currency session amount.
 * Missing or stale rates reject the whole aggregation — a settlement must
 * never convert with out-of-date prices or invent a rate.
 */
async function resolveFxRate(
  tx: DBTransaction,
  originalCurrency: CurrencyCode,
  dominantCurrency: CurrencyCode,
  tErrors: ErrorsLabels
): Promise<string> {
  const latest = await BillingRepository.getLatestExchangeRateForDisplay(originalCurrency, dominantCurrency, tx);
  if (latest.rate == null || latest.stale) {
    throw new DomainError("CARRYOVER_FX_RATE_MISSING", tErrors.carryover.fxRateMissing);
  }
  return latest.rate;
}

/**
 * Builds the per-session snapshot items and the aggregate payable for one
 * teacher group. Sessions whose currency matches the dominant currency keep
 * `convertedAmount` null; cross-currency sessions convert through the latest
 * FX rate and preserve the original amounts on the item row.
 */
async function buildItemDrafts(
  tx: DBTransaction,
  instances: readonly ClassInstanceSelectType[],
  dominantCurrency: CurrencyCode,
  tErrors: ErrorsLabels
): Promise<{ drafts: CarryoverItemDraft[]; payable: string }> {
  let payableMinorUnits = 0n;
  const drafts = await mapInSequence(instances, async instance => {
    const originalAmount = instance.teacherPaidAmount ?? ZERO_AMOUNT;
    const originalCurrency = instance.teacherPaidCurrency ?? dominantCurrency;
    let convertedAmount: string | null = null;
    let convertedCurrency: CurrencyCode | null = null;
    if (originalCurrency !== dominantCurrency) {
      const rate = await resolveFxRate(tx, originalCurrency, dominantCurrency, tErrors);
      convertedAmount = convertAmountWithRate(originalAmount, rate);
      if (convertedAmount == null) {
        throw new DomainError("CARRYOVER_AMOUNT_INVALID", tErrors.internalServerError);
      }
      convertedCurrency = dominantCurrency;
    }
    const payableUnits = toAmountMinorUnits(convertedAmount ?? originalAmount);
    if (payableUnits == null) {
      throw new DomainError("CARRYOVER_AMOUNT_INVALID", tErrors.internalServerError);
    }
    payableMinorUnits += payableUnits;
    const draft: CarryoverItemDraft = {
      classInstanceId: instance.id,
      originalAmount,
      originalCurrency,
      originalStatus: instance.calculationStatus,
      originalPartialPercentage: instance.isPartialPercentage,
      convertedAmount,
      convertedCurrency,
    };
    return draft;
  });
  return { drafts, payable: formatAmountMinorUnits(payableMinorUnits) };
}

/** Resolves the group's aggregate values (dominant currency, students text, hours, payable) and inserts the carryover row. */
async function insertGroupCarryoverRow(
  tx: DBTransaction,
  teacherId: string,
  groupInstances: ClassInstanceSelectType[],
  note: string | null,
  actorUserId: string,
  tErrors: ErrorsLabels
): Promise<PreparedGroupCarryover> {
  const teacher = await TeacherRepository.findById(teacherId, tx);
  if (teacher == null) {
    throw new NotFoundError("TEACHER", tErrors.teacher.teacherNotFound(teacherId));
  }

  const dominantCurrency = resolveDominantCurrency(groupInstances, teacher.rateCurrency ?? DEFAULT_AGGREGATE_CURRENCY);
  const studentsSummary = await buildStudentsSummary(groupInstances, tx);
  const totalDuration = computeTotalDurationHours(groupInstances);
  const { drafts, payable } = await buildItemDrafts(tx, groupInstances, dominantCurrency, tErrors);
  const isDisabledTeacher = await TeacherRepository.isDisabled(teacherId, tx);

  const carryover = await CarryoverBalanceRepository.create(
    {
      teacherId,
      studentsCount: studentsSummary.count,
      studentsText: studentsSummary.text,
      totalDuration,
      payable,
      teacherCurrency: dominantCurrency,
      paid: ZERO_AMOUNT,
      fromDate: minDate(groupInstances.map(instance => instance.scheduledStartAt)),
      toDate: maxDate(groupInstances.map(instance => instance.scheduledStartAt)),
      paymentDate: null,
      isDisabledTeacher,
      isPaid: false,
      expenseId: null,
      note,
      createdByUserId: actorUserId,
    },
    tx
  );

  return {
    carryover,
    drafts,
    dominantCurrency,
    studentsCount: studentsSummary.count,
    totalDuration,
    payable,
  };
}

/** Persists the item snapshots, links the sessions, and moves them to WAITING_PAID. */
async function linkGroupSessionsToCarryover(
  tx: DBTransaction,
  groupInstances: readonly ClassInstanceSelectType[],
  drafts: readonly CarryoverItemDraft[],
  carryoverId: string,
  actorUserId: string
): Promise<string[]> {
  await CarryoverBalanceRepository.insertItems(
    drafts.map(draft => Object.assign({}, draft, { carryoverId })),
    tx
  );
  const groupInstanceIds = groupInstances.map(instance => instance.id);
  await SchedulingRepository.linkToCarryover(groupInstanceIds, carryoverId, tx);
  await transitionSessions(
    tx,
    groupInstances.map(instance => ({
      instanceId: instance.id,
      fromStatus: instance.calculationStatus,
      toStatus: CalculationStatus.WAITING_PAID,
      teacherPaidAmount: instance.teacherPaidAmount ?? null,
      isPartialPercentage: null,
    })),
    `Linked to carryover ${carryoverId}`,
    actorUserId
  );
  return groupInstanceIds;
}

/** Creates one carryover (items, session link + transitions, audit row) for a single teacher group. */
async function createCarryoverForGroup(
  tx: DBTransaction,
  teacherId: string,
  groupInstances: ClassInstanceSelectType[],
  note: string | null,
  actorUserId: string,
  idempotencyKey: string,
  tErrors: ErrorsLabels
): Promise<GroupCreationOutcome> {
  const prepared = await insertGroupCarryoverRow(tx, teacherId, groupInstances, note, actorUserId, tErrors);
  const groupInstanceIds = await linkGroupSessionsToCarryover(
    tx,
    groupInstances,
    prepared.drafts,
    prepared.carryover.id,
    actorUserId
  );

  const auditLogId = await emitCarryoverAuditLog(tx, {
    actorUserId,
    actorType: "USER",
    entityType: CARRYOVER_AUDIT_ENTITY_TYPE,
    entityId: prepared.carryover.id,
    action: CARRYOVER_ACTION_CREATE,
    metadata: {
      idempotencyKey,
      teacherId,
      instanceIds: groupInstanceIds,
      studentsCount: prepared.studentsCount,
      totalDuration: prepared.totalDuration,
      payable: prepared.payable,
      currency: prepared.dominantCurrency,
    },
  });

  return {
    group: {
      teacherId,
      carryoverId: prepared.carryover.id,
      studentsCount: prepared.studentsCount,
      totalDuration: prepared.totalDuration,
      payable: prepared.payable,
      currency: prepared.dominantCurrency,
      instanceIds: groupInstanceIds,
    },
    auditLogId,
  };
}

/** Rebuilds the original bulk-create result from the persisted audit rows, in creation order. */
function reconstructBulkCreate(
  logs: readonly AuditLogReturnType[],
  instanceIds: string[]
): BulkCreateCarryoverResult | null {
  if (logs.length === 0) return null;
  const groups: BulkCreateCarryoverGroupResult[] = [];
  const auditLogIds: string[] = [];
  for (const log of logs.toReversed()) {
    const group = parseReplayGroup(log);
    if (group == null) return null;
    groups.push(group);
    auditLogIds.push(log.id);
  }
  return { groups, totalInstanceIds: instanceIds, auditLogIds };
}

/**
 * Runs the bulk-create transaction body: locks the selected sessions,
 * validates they are audited and unlinked, converts cross-currency amounts
 * into each group's dominant currency, inserts the carryover + item
 * snapshots, links the sessions and moves them to WAITING_PAID, and emits one
 * audit row per created carryover. A same-content re-submit inside the
 * idempotency window replays the originally persisted result.
 */
export async function bulkCreateWithinTransaction(
  tx: DBTransaction,
  input: BulkCreateCarryoverInput,
  instanceIds: readonly string[],
  note: string | null,
  idempotencyKey: string,
  tErrors: ErrorsLabels
): Promise<BulkCreateCarryoverResult> {
  await acquireAdvisoryLock(tx, `carryover-bulk-create:${idempotencyKey}`);

  const replayLogs = await findReplayAuditLogs(tx, input.actorUserId, CARRYOVER_ACTION_CREATE, idempotencyKey);
  const replayed = reconstructBulkCreate(replayLogs, [...instanceIds]);
  if (replayed) return replayed;

  const instances = await SchedulingRepository.getByIdsForUpdate([...instanceIds], tx);
  assertAllInstancesFound(instances, instanceIds, tErrors);
  validateInstancesForCarryover(instances, tErrors);

  const created: BulkCreateCarryoverGroupResult[] = [];
  const auditLogIds: string[] = [];
  const groups = groupInstancesByTeacher(instances);
  await forEachInSequence([...groups.entries()], async ([teacherId, groupInstances]) => {
    const outcome = await createCarryoverForGroup(
      tx,
      teacherId,
      groupInstances,
      note,
      input.actorUserId,
      idempotencyKey,
      tErrors
    );
    created.push(outcome.group);
    if (outcome.auditLogId != null) auditLogIds.push(outcome.auditLogId);
  });

  logger.info("Carryover balances created", {
    actorUserId: input.actorUserId,
    groupCount: created.length,
    instanceCount: instanceIds.length,
  });
  return { groups: created, totalInstanceIds: [...instanceIds], auditLogIds };
}

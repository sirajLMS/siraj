import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { classInstances } from "@/backend/db/schema";
import { AppPermission, CalculationStatus } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { requirePermission } from "@/backend/services/billing/permission-utils";
import { PayrollCalculationService } from "@/backend/services/teacher/payroll-calculation.service";
import type { PayrollCalculationResult } from "@/backend/types";
import { ClassExecutionState } from "@/shared/constants/class-instance-detail.enum";
import type { ErrorsLabels } from "@/shared/locale";
import { getServerTranslations } from "@/shared/locale/server-graphql";

/**
 * One-shot, out-of-band payroll backfill: recalculates the payroll snapshot
 * for historical terminal sessions that never received one (they still sit at
 * the schema-default NOT_CALCULATED with no snapshot timestamp).
 *
 * Re-running is safe: every processed row gains a payrollCalculatedAt
 * timestamp, so later runs find zero candidates. Rows the calculator already
 * degraded (rate-tier failures) or an operator explicitly parked at Not
 * Calculated keep their timestamp and are left for the payroll reports grid
 * and the override dialog — this script never reprocesses them.
 *
 * The operator identity is mandatory: the payroll calculator is
 * permission-gated (accounting payroll-manage) and attributes every snapshot
 * and audit event to the supplied user — the same attribution a manual
 * override from the reports grid carries. Actor-less runs are not supported.
 */

/** Maximum candidate rows processed per run — unbounded-SELECT guard. */
const MAX_INSTANCES_PER_RUN = 500;

const DRY_RUN_FLAG = "--dryRun";
const ACTOR_ARG_PREFIX = "--actor-user-id=";
const HELP_FLAG = "--help";

const LOG_PREFIX = "[PayrollBackfill]";

/**
 * Execution states for which a payroll snapshot is meaningful — mirrors the
 * payroll calculator's terminal-state set. Rows that slip through anyway are
 * rejected per-instance by the calculator's own terminal-state guard.
 */
const TERMINAL_EXECUTION_STATES: readonly ClassExecutionState[] = [
  ClassExecutionState.COMPLETED,
  ClassExecutionState.ON_DEMAND_NO_CREDITS_CANCELLED,
  ClassExecutionState.ON_DEMAND_NO_CREDITS_ABSENT,
  ClassExecutionState.ON_DEMAND_CONFLICT_HELD,
  ClassExecutionState.ON_DEMAND_PENDING_CREDITS,
];

interface BackfillCandidate {
  id: string;
  teacherId: string;
  executionState: string;
}

export interface PayrollBackfillOptions {
  actorUserId: string;
  dryRun: boolean;
}

export interface PayrollBackfillSummary {
  mode: "apply" | "dry-run";
  candidates: number;
  processed: number;
  failed: number;
}

export type ParsedBackfillArgs =
  | { ok: true; help: true }
  | { ok: true; help: false; options: PayrollBackfillOptions }
  | { ok: false; error: string };

/**
 * Sentinel thrown inside the dry-run transaction so the previewed snapshot
 * and its status event always roll back: the dry run reports the
 * calculator's exact output without persisting anything.
 */
class DryRunRollback extends Error {
  constructor(readonly preview: PayrollCalculationResult) {
    super("payroll backfill dry-run rollback");
    this.name = "DryRunRollback";
  }
}

async function findBackfillCandidates(): Promise<BackfillCandidate[]> {
  return db
    .select({
      id: classInstances.id,
      teacherId: classInstances.teacherId,
      executionState: classInstances.executionState,
    })
    .from(classInstances)
    .where(
      and(
        inArray(classInstances.executionState, TERMINAL_EXECUTION_STATES),
        eq(classInstances.calculationStatus, CalculationStatus.NOT_CALCULATED),
        isNull(classInstances.payrollCalculatedAt),
        isNull(classInstances.deletedAt)
      )
    )
    .limit(MAX_INSTANCES_PER_RUN);
}

/**
 * Runs the real calculator for one instance inside a transaction that always
 * rolls back and returns the previewed snapshot. The embedded run relies on
 * the caller's row lock and skips the teacher advisory lock, so a preview
 * cannot deadlock against live payroll traffic.
 */
async function previewCalculation(
  instanceId: string,
  actorUserId: string,
  tErrors: ErrorsLabels
): Promise<PayrollCalculationResult> {
  try {
    // The callback always throws the rollback sentinel, so nothing the
    // calculator wrote inside this transaction can persist.
    await db.transaction(async tx => {
      const previewed = await PayrollCalculationService.calculateForInstance(
        { instanceId, actorUserId, forceRecalc: true },
        tErrors,
        tx
      );
      throw new DryRunRollback(previewed);
    });
  } catch (error) {
    if (error instanceof DryRunRollback) {
      return error.preview;
    }
    throw error;
  }
  throw new Error("payroll backfill dry-run transaction must always roll back");
}

async function processCandidate(
  candidate: BackfillCandidate,
  options: PayrollBackfillOptions,
  tErrors: ErrorsLabels
): Promise<void> {
  if (options.dryRun) {
    const preview = await previewCalculation(candidate.id, options.actorUserId, tErrors);
    logger.info(
      `${LOG_PREFIX} dry-run instance=${candidate.id} teacher=${candidate.teacherId} proposed: ` +
        `status=${preview.calculationStatus} duration=${preview.calculatedDuration} ` +
        `amount=${preview.teacherPaidAmount} currency=${preview.teacherPaidCurrency}`
    );
    return;
  }

  const result = await PayrollCalculationService.calculateForInstance(
    { instanceId: candidate.id, actorUserId: options.actorUserId, forceRecalc: true },
    tErrors
  );
  logger.info(
    `${LOG_PREFIX} recalculated instance=${candidate.id} teacher=${candidate.teacherId} ` +
      `status=${result.calculationStatus} amount=${result.teacherPaidAmount} currency=${result.teacherPaidCurrency}`
  );
}

export async function runPayrollBackfill(options: PayrollBackfillOptions): Promise<PayrollBackfillSummary> {
  const tErrors = getServerTranslations("en").errorsTranslations;

  // Fail fast when the operator cannot authorize recalculations: the
  // calculator re-checks the permission per instance, but an unauthorized
  // actor would otherwise report one failure per candidate row.
  await requirePermission(options.actorUserId, AppPermission.ACCOUNTING_PAYROLL_MANAGE, tErrors);

  const candidates = await findBackfillCandidates();
  logger.info(
    `${LOG_PREFIX} Found ${candidates.length} terminal session(s) without a payroll snapshot ` +
      `(max ${MAX_INSTANCES_PER_RUN} per run).`
  );

  const summary: PayrollBackfillSummary = {
    mode: options.dryRun ? "dry-run" : "apply",
    candidates: candidates.length,
    processed: 0,
    failed: 0,
  };

  // Sequential per-candidate processing (via reduce) rather than Promise.all:
  // each calculation takes the teacher advisory lock and the instance row
  // lock inside its own transaction, so a serial run never contends with
  // itself and interleaves safely with live traffic. The reduce callback is
  // not a loop body, so it does not trip no-await-in-loop.
  await candidates.reduce(async (chain, candidate) => {
    await chain;
    try {
      await processCandidate(candidate, options, tErrors);
      summary.processed += 1;
    } catch (error) {
      summary.failed += 1;
      logger.error(
        `${LOG_PREFIX} Failed to recalculate instance=${candidate.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { instanceId: candidate.id, teacherId: candidate.teacherId, error }
      );
    }
  }, Promise.resolve());

  logger.info(
    `${LOG_PREFIX} ${summary.mode} complete: ${summary.processed} processed, ` +
      `${summary.failed} failed, ${summary.candidates} candidate(s).`
  );
  return summary;
}

export function parseBackfillArgs(argv: readonly string[]): ParsedBackfillArgs {
  let actorUserId: string | null = null;
  let dryRun = false;
  let help = false;

  for (const arg of argv) {
    if (arg === DRY_RUN_FLAG) {
      dryRun = true;
      continue;
    }
    if (arg === HELP_FLAG) {
      help = true;
      continue;
    }
    if (arg.startsWith(ACTOR_ARG_PREFIX)) {
      actorUserId = arg.slice(ACTOR_ARG_PREFIX.length);
      continue;
    }
    return { ok: false, error: `unknown argument: ${arg}` };
  }

  if (help) {
    return { ok: true, help: true };
  }
  if (actorUserId === null || actorUserId.trim() === "") {
    return {
      ok: false,
      error: `missing ${ACTOR_ARG_PREFIX}<uuid> — the operator whose payroll-manage permission authorizes the recalculation`,
    };
  }
  return { ok: true, help: false, options: { actorUserId, dryRun } };
}

function printUsage(): void {
  process.stderr.write(
    [
      "Usage: bun run scripts/payroll-backfill.ts [--dryRun] --actor-user-id=<uuid>",
      "",
      "Recalculates the payroll snapshot for terminal class instances that never",
      `received one (at most ${MAX_INSTANCES_PER_RUN} per run — re-run until a run`,
      "reports zero candidates; every run is idempotent). The operator must hold",
      "the accounting payroll-manage permission; snapshots and audit events are",
      "attributed to that user.",
      "",
      "  --actor-user-id=<uuid>  user id the recalculation is attributed to (required)",
      "  --dryRun                preview the calculator's patches without persisting",
      "  --help                  print this help",
      "",
    ].join("\n")
  );
}

if (import.meta.main) {
  const parsed = parseBackfillArgs(process.argv.slice(2));
  if (!parsed.ok) {
    process.stderr.write(`payroll-backfill: ${parsed.error}\n\n`);
    printUsage();
    process.exit(2);
  }
  if (parsed.help) {
    printUsage();
    process.exit(0);
  }
  runPayrollBackfill(parsed.options)
    .then(summary => process.exit(summary.failed > 0 ? 1 : 0))
    .catch(error => {
      logger.error(`${LOG_PREFIX} Aborted: ${error instanceof Error ? error.message : String(error)}`, {
        error,
      });
      process.exit(1);
    });
}

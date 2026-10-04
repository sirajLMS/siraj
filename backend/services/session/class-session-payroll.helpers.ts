import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { DatabaseUnavailableError, DomainError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import { PayrollCalculationService } from "@/backend/services/teacher/payroll-calculation.service";
import type { ClassInstanceSelectType, DBTransaction } from "@/backend/types";
import { ClassExecutionState } from "@/shared/constants/class-instance-detail.enum";
import { parseClassExecutionState } from "@/shared/lib/enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

/**
 * Terminal on-demand execution states. A transition into one of these closes
 * the session without a live meeting; the payroll calculation for such rows
 * carries the on-demand flag so absence semantics resolve correctly.
 */
const ON_DEMAND_TERMINAL_EXECUTION_STATES = new Set<string>([
  ClassExecutionState.ON_DEMAND_PENDING_CREDITS,
  ClassExecutionState.ON_DEMAND_CONFLICT_HELD,
  ClassExecutionState.ON_DEMAND_NO_CREDITS_CANCELLED,
  ClassExecutionState.ON_DEMAND_NO_CREDITS_ABSENT,
]);

/**
 * Calculator rejections the auto-trigger treats as routine deferrals rather
 * than failures: the actor lacks the payroll manage permission (teachers and
 * parents close their own sessions without it), the row's pay is already
 * settled, or the calculator's terminal-state guard tripped on a re-read.
 * The snapshot stays uncalculated for operator reconciliation in all three
 * cases, so these log as warnings and stay out of error alerts.
 */
const ROUTINE_CALCULATOR_REJECTIONS = new Set<string>(["FORBIDDEN", "PAYROLL_NOT_TERMINAL", "PAYROLL_ALREADY_PAID"]);

/** SQLSTATE codes are five characters starting with a digit; domain codes can never match. */
const SQLSTATE_PATTERN = /^\d[0-9A-Z]{4}$/;

/** Cause-chain depth cap for the SQLSTATE search, mirroring the transient-error classifier. */
const MAX_CAUSE_DEPTH = 5;

export function isTerminalOnDemandExecutionState(executionState: string): boolean {
  return ON_DEMAND_TERMINAL_EXECUTION_STATES.has(executionState);
}

/**
 * Finds the SQLSTATE of a database driver failure anywhere in an error cause
 * chain. Query wrappers nest the driver error in `cause` — the same chain
 * shape the transient-error classifier walks — and the depth cap keeps
 * pathological chains bounded.
 */
function findDatabaseSqlState(error: unknown, depth = 0): string | null {
  if (depth > MAX_CAUSE_DEPTH || typeof error !== "object" || error === null) return null;
  const code = (error as { code?: unknown }).code;
  if (typeof code === "string" && SQLSTATE_PATTERN.test(code)) return code;
  const cause = (error as { cause?: unknown }).cause;
  if (cause !== undefined && cause !== error) {
    return findDatabaseSqlState(cause, depth + 1);
  }
  return null;
}

/**
 * Runs the automatic payroll calculation for an instance that just reached a
 * terminal execution state, inside the same transaction as the state change so
 * the payroll snapshot and the transition commit or roll back together.
 *
 * The calculation is best-effort by design. Policy rejections are routine
 * deferrals: the snapshot stays NOT_CALCULATED and an operator reconciles it
 * later, so they log as warnings instead of errors. Every other rejection is
 * logged as an error but still swallowed. A failure at the database driver
 * level aborts the shared transaction on the server, so it is logged with an
 * explicit transaction-abort warning rather than a preservation claim.
 */
export async function triggerTerminalPayrollCalculation(
  instance: ClassInstanceSelectType,
  actorUserId: string,
  tErrors: ErrorsLabels,
  tx: DBTransaction
): Promise<void> {
  try {
    await PayrollCalculationService.calculateForInstance(
      {
        instanceId: instance.id,
        actorUserId,
        isOnDemand: ON_DEMAND_TERMINAL_EXECUTION_STATES.has(parseClassExecutionState(instance.executionState)),
      },
      tErrors,
      tx
    );
  } catch (error) {
    if (error instanceof DomainError && ROUTINE_CALCULATOR_REJECTIONS.has(error.code)) {
      logger.warn("Automatic payroll calculation deferred; session state change preserved", {
        classInstanceId: instance.id,
        actorUserId,
        reason: error.code,
        error: error.message,
      });
      return;
    }
    const sqlState = findDatabaseSqlState(error);
    if (sqlState !== null || error instanceof DatabaseUnavailableError) {
      logger.error(
        "Automatic payroll calculation failed at the database level; the transition transaction may be aborted",
        {
          classInstanceId: instance.id,
          actorUserId,
          sqlState,
          error: error instanceof Error ? error.message : String(error),
        }
      );
      return;
    }
    logger.error("Automatic payroll calculation failed; session state change preserved", {
      classInstanceId: instance.id,
      actorUserId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Runs the payroll calculation for every instance the no-credits batch update
 * actually moved into the given terminal on-demand state. Rows a concurrent
 * transaction already claimed (still in their previous state) are skipped so
 * an unresolved pending-credit session is never calculated early. System flows
 * without an authenticated actor defer the calculation to an operator
 * reconciliation — there is no user to attribute the payroll write to.
 */
export async function triggerPayrollForOndemandResolution(
  tx: DBTransaction,
  instanceIds: readonly string[],
  executionState: string,
  actorUserId: string | null
): Promise<void> {
  if (!actorUserId) {
    logger.warn("On-demand terminal resolution without an actor; payroll calculation deferred", {
      executionState,
      instanceIds,
    });
    return;
  }
  const tErrors = getServerTranslations("en").errorsTranslations;
  await Promise.all(
    instanceIds.map(async instanceId => {
      const instance = await SchedulingRepository.getById(instanceId, tx);
      if (instance?.executionState !== executionState) return;
      await triggerTerminalPayrollCalculation(instance, actorUserId, tErrors, tx);
    })
  );
}

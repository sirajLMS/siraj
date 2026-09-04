import { ClassExecutionState, ClassOutcome } from "@/shared/constants/class-instance-detail.enum";

export type SessionAuditStatus = "open" | "end" | "Absent" | "absent_student";

/**
 * Maps the execution-state + outcome + actual-start-at triple of a class
 * instance into the audit-report status. Pure function — no side effects,
 * no I/O. Used by the server-side query builder and by the frontend so the
 * rule is defined exactly once.
 *
 * Rules:
 * - COMPLETED + TAKEN → "end"
 * - COMPLETED + ABSENT + no actual start → "Absent" (teacher absence)
 * - COMPLETED + ABSENT + actual start set → "absent_student"
 * - COMPLETED + LEAVE → "absent_student"
 * - everything else (RUNNING, ACTIVATED, NOT_ACTIVATED, ON_DEMAND_*,
 *   unmatched combos, null inputs) → "open"
 */
export function mapToSessionAuditStatus(
  executionState: ClassExecutionState | null | undefined,
  outcome: ClassOutcome | null | undefined,
  actualStartAt: Date | string | null | undefined
): SessionAuditStatus {
  if (executionState === ClassExecutionState.COMPLETED) {
    if (outcome === ClassOutcome.TAKEN) return "end";
    if (outcome === ClassOutcome.ABSENT) {
      return actualStartAt == null ? "Absent" : "absent_student";
    }
    if (outcome === ClassOutcome.LEAVE) return "absent_student";
  }
  return "open";
}

/**
 * Inverse mapper: given a target SessionAuditStatus, returns the SQL
 * predicate key that selects rows matching that status. Used by the report
 * repository to expand a status filter into a disjunction of
 * (execution_state, outcome, actual_start_at IS [NOT] NULL) triples.
 */
export const STATUS_TO_PREDICATE_KEY: Record<SessionAuditStatus, string> = {
  open: "open",
  end: "end",
  Absent: "Absent",
  absent_student: "absent_student",
};

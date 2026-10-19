import { type SQL, sql } from "drizzle-orm";
import { classInstances } from "@/backend/db/schema";
import { ClassExecutionState, ClassOutcome } from "@/shared/constants/class-instance-detail.enum";
import { type SessionAuditStatus, STATUS_TO_PREDICATE_KEY } from "@/shared/constants/classes/session-audit-status";

const COMPLETED = ClassExecutionState.COMPLETED;

/**
 * Outcomes that, together with a completed execution state, close a session
 * for audit purposes. A completed session whose outcome is outside this set
 * is still considered open.
 */
const TERMINAL_COMPLETED_OUTCOMES: readonly ClassOutcome[] = [
  ClassOutcome.TAKEN,
  ClassOutcome.ABSENT,
  ClassOutcome.LEAVE,
];

const COMPLETED_EXECUTION = sql`${classInstances.executionState} = ${COMPLETED}`;

/**
 * Inverse of the row-level status mapper: each audit status selects exactly
 * the rows the mapper would assign to it. The fragments reference the
 * class_instances execution-state / outcome / actual-start-at columns so they
 * can be embedded directly in a repository WHERE clause.
 *
 * - `open` is the complement of the terminal set: every row the mapper's
 *   catch-all would classify as open.
 * - `absent_student` covers both a student leave and an absence where the
 *   teacher did join the room.
 */
const STATUS_PREDICATES: Record<SessionAuditStatus, SQL> = {
  open: sql`NOT (${COMPLETED_EXECUTION} AND ${classInstances.outcome} IN ${TERMINAL_COMPLETED_OUTCOMES})`,
  end: sql`${COMPLETED_EXECUTION} AND ${classInstances.outcome} = ${ClassOutcome.TAKEN}`,
  Absent: sql`${COMPLETED_EXECUTION} AND ${classInstances.outcome} = ${ClassOutcome.ABSENT} AND ${classInstances.actualStartAt} IS NULL`,
  absent_student: sql`${COMPLETED_EXECUTION} AND (${classInstances.outcome} = ${ClassOutcome.LEAVE} OR (${classInstances.outcome} = ${ClassOutcome.ABSENT} AND ${classInstances.actualStartAt} IS NOT NULL))`,
};

const KNOWN_STATUSES: readonly SessionAuditStatus[] = ["open", "end", "Absent", "absent_student"];

/**
 * Module-level O(1) Map lookup for mapping candidate status strings to predicate keys.
 * Performance optimization: Replaces linear `KNOWN_STATUSES.find(...)` scans on every status lookup.
 */
const PREDICATE_KEY_MAP = new Map<string, SessionAuditStatus>(
  KNOWN_STATUSES.map(status => [STATUS_TO_PREDICATE_KEY[status], status])
);

/**
 * Resolves a raw status string against the predicate-key registry in O(1) time. Values the
 * registry does not know fall back to the open predicate, mirroring the
 * mapper's catch-all classification of unmatched rows.
 */
function toPredicateKey(candidate: string): SessionAuditStatus {
  return PREDICATE_KEY_MAP.get(candidate) ?? "open";
}

/**
 * Expands a list of audit-status filter values into a single WHERE fragment
 * that selects the rows matching any of them (logical OR across per-status
 * predicates).
 *
 * Status strings arrive from an untrusted boundary (GraphQL filter input and
 * URL query parameters for the export route), so the parameter is typed as
 * raw strings and normalized here.
 *
 * Performance optimization: Single-pass loop populates a `Set` directly, eliminating
 * intermediate array allocations from `.map()` and array spread (`[...]`) before generating SQL fragments.
 *
 * - Duplicate statuses collapse into one predicate.
 * - Unrecognized values fall back to the open predicate.
 * - An empty list matches every row; callers treat the absence of a status
 *   filter as "no filtering".
 */
export function expandStatusesToSql(statuses: readonly string[]): SQL {
  if (statuses.length === 0) return sql`true`;

  const uniqueStatuses = new Set<SessionAuditStatus>();
  for (let i = 0; i < statuses.length; i++) {
    uniqueStatuses.add(toPredicateKey(statuses[i]));
  }

  if (uniqueStatuses.size === 0) return sql`true`;

  const fragments: SQL[] = [];
  for (const status of uniqueStatuses) {
    fragments.push(sql`(${STATUS_PREDICATES[status]})`);
  }
  return sql.join(fragments, sql` OR `);
}

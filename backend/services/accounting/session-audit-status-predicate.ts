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
 * Resolves a raw status string against the predicate-key registry. Values the
 * registry does not know fall back to the open predicate, mirroring the
 * mapper's catch-all classification of unmatched rows.
 */
function toPredicateKey(candidate: string): SessionAuditStatus {
  const known = KNOWN_STATUSES.find(status => STATUS_TO_PREDICATE_KEY[status] === candidate);
  return known ?? "open";
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
 * - Duplicate statuses collapse into one predicate.
 * - Unrecognized values fall back to the open predicate.
 * - An empty list matches every row; callers treat the absence of a status
 *   filter as "no filtering".
 */
export function expandStatusesToSql(statuses: readonly string[]): SQL {
  const uniqueStatuses = [...new Set(statuses.map(toPredicateKey))];
  if (uniqueStatuses.length === 0) return sql`true`;

  const fragments = uniqueStatuses.map(status => sql`(${STATUS_PREDICATES[status]})`);
  return sql.join(fragments, sql` OR `);
}

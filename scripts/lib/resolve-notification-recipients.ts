import { inArray } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import type { DBTransaction } from "@/backend/types";
import { parents, students } from "@/backend/db/schema";

export interface ResolvedRecipient {
  studentId: string;
  studentName: string;
  affectedUserIds: string[];
}

/**
 * Resolves notification recipients for a set of student IDs: queries the
 * student + parent tables, determines whether a parent is linked, and
 * prefers the parent's userId as the notification recipient (falling back
 * to the student's own userId when no parent is linked or the parent has
 * no userId).
 *
 * Returns a Map keyed by `studentId` so callers can look up recipients
 * for individual students without re-querying.
 *
 * @param studentIds - Distinct student IDs to resolve recipients for.
 * @param tx - Optional transaction handle; when omitted, uses the cached
 *             HTTP database singleton (stateless read) per Neon HTTP
 *             client rules.
 */
export async function resolveStudentNotificationRecipients(
  studentIds: string[],
  tx?: DBTransaction
): Promise<Map<string, ResolvedRecipient>> {
  const result = new Map<string, ResolvedRecipient>();
  if (studentIds.length === 0) return result;

  const q = queryDb(tx);

  const studentRows = await q
    .select({
      studentId: students.id,
      studentName: students.name,
      studentUserId: students.userId,
      parentId: students.parentId,
    })
    .from(students)
    .where(inArray(students.id, studentIds));

  if (studentRows.length === 0) return result;

  // Batch-fetch parent userIds for all students that have a parent link.
  const validParents = studentRows.filter(s => s.parentId !== null);
  let parentUserMap = new Map<string, string>();

  if (validParents.length > 0) {
    const parentIds = [...new Set(validParents.flatMap(s => (s.parentId !== null ? [s.parentId] : [])))];
    const parentRows = await q
      .select({ parentId: parents.id, userId: parents.userId })
      .from(parents)
      .where(inArray(parents.id, parentIds));
    parentUserMap = new Map(parentRows.map(p => [p.parentId, p.userId]));
  }

  for (const row of studentRows) {
    const parentUserId = row.parentId ? (parentUserMap.get(row.parentId) ?? null) : null;
    const affectedUserIds: string[] = [];
    if (parentUserId) {
      affectedUserIds.push(parentUserId);
    } else if (row.studentUserId) {
      affectedUserIds.push(row.studentUserId);
    }

    result.set(row.studentId, {
      studentId: row.studentId,
      studentName: row.studentName,
      affectedUserIds,
    });
  }

  return result;
}

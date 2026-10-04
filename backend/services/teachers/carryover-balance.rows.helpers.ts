import { inArray } from "drizzle-orm";
import { TeacherRepository, UserRepository } from "@/backend/db/repo";
import { students } from "@/backend/db/schema";
import { logger } from "@/backend/lib";
import { truncateWithEllipsis } from "@/backend/services/teachers/carryover-aggregate";
import { STUDENTS_TEXT_MAX_LENGTH } from "@/backend/services/teachers/carryover-balance.constants";
import type {
  CarryoverBalanceSelectType,
  CarryoverLinkedSession,
  CarryoverLinkedSessionRow,
  CarryoverPaidRowCounts,
  CarryoverRow,
  ClassInstanceSelectType,
  DBTransaction,
  TeacherDisplayFields,
} from "@/backend/types";

/** Resolves the teacher's display name + avatar; missing rows fall back rather than failing the report. */
export async function resolveTeacherDisplay(
  teacherId: string,
  tx: DBTransaction | undefined,
  fallbackName: string
): Promise<TeacherDisplayFields> {
  const teacher = await TeacherRepository.findById(teacherId, tx);
  if (teacher == null) return { teacherName: fallbackName, teacherAvatarUrl: null };
  const usersById = await UserRepository.findByIds([teacher.userId], tx);
  const user = usersById.get(teacher.userId);
  return { teacherName: user?.name ?? fallbackName, teacherAvatarUrl: user?.avatarUrl ?? null };
}

export async function toCarryoverRow(
  row: CarryoverBalanceSelectType,
  tx: DBTransaction | undefined,
  fallbackName: string
): Promise<CarryoverRow> {
  const display = await resolveTeacherDisplay(row.teacherId, tx, fallbackName);
  return mapCarryoverRow(row, display);
}

export function mapCarryoverRow(row: CarryoverBalanceSelectType, display: TeacherDisplayFields): CarryoverRow {
  return {
    id: row.id,
    teacherId: row.teacherId,
    teacherName: display.teacherName,
    teacherAvatarUrl: display.teacherAvatarUrl,
    studentsCount: row.studentsCount,
    studentsText: row.studentsText,
    totalDuration: row.totalDuration,
    payable: row.payable,
    teacherCurrency: row.teacherCurrency,
    paid: row.paid,
    fromDate: row.fromDate,
    toDate: row.toDate,
    paymentDate: row.paymentDate,
    isDisabledTeacher: row.isDisabledTeacher,
    isPaid: row.isPaid,
    expenseId: row.expenseId,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
    paidAt: row.paidAt?.toISOString() ?? null,
  };
}

/**
 * Student display names for a group of instances, read inside the caller's
 * transaction so freshly created fixtures and concurrent edits are visible.
 * `students.name` is a denormalized snapshot column owned by the student row.
 */
export async function buildStudentsSummary(
  instances: readonly ClassInstanceSelectType[],
  tx: DBTransaction
): Promise<{ text: string | null; count: number }> {
  const studentIds = [
    ...new Set(instances.map(instance => instance.studentId).filter((id): id is string => id != null)),
  ];
  if (studentIds.length === 0) return { text: null, count: 0 };
  const rows = await tx
    .select({ id: students.id, name: students.name })
    .from(students)
    .where(inArray(students.id, studentIds));
  const nameById = new Map(rows.map(row => [row.id, row.name]));
  const names = studentIds.map(id => nameById.get(id)).filter((name): name is string => name != null);
  const joined = names.join(", ");
  if (joined.length <= STUDENTS_TEXT_MAX_LENGTH) {
    return { text: joined, count: studentIds.length };
  }
  logger.warn("Carryover students text truncated", { studentsCount: studentIds.length, fullLength: joined.length });
  return { text: truncateWithEllipsis(joined, STUDENTS_TEXT_MAX_LENGTH), count: studentIds.length };
}

export function countRowsByPaid(rows: readonly CarryoverBalanceSelectType[]): CarryoverPaidRowCounts {
  let paid = 0;
  for (const row of rows) {
    if (row.isPaid) paid += 1;
  }
  return { paid, unpaid: rows.length - paid };
}

export function mapLinkedSessionRow(row: CarryoverLinkedSessionRow): CarryoverLinkedSession {
  return { ...row, scheduledStartAt: row.scheduledStartAt.toISOString() };
}

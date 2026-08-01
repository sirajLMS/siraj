import { eq, or } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { ParentRepository, StudentRepository, TeacherRepository } from "@/backend/db/repo";
import { students, teacherAssignments } from "@/backend/db/schema";

/**
 * Resolves whether the calling user is associated with the given student as
 * the student's parent or primary teacher. Used to scope IDOR-vulnerable
 * reads so a caller with QUOTAS_VIEW can only access their own students'
 * data; admins/teachers with QUOTAS_MANAGE bypass via the permission check.
 *
 * The parent and teacher lookups are independent of each other, so they run
 * in parallel via `Promise.all` to reduce sequential query latency.
 */
export async function resolveAssociatedViewer(actorUserId: string, studentId: string): Promise<boolean> {
  const profile = await StudentRepository.findProfileById(studentId);
  if (!profile) return false;

  const [parent, teacher] = await Promise.all([
    ParentRepository.findByUserId(actorUserId),
    TeacherRepository.findByUserId(actorUserId),
  ]);

  if (parent?.id === profile?.parentId) return true;
  if (teacher?.id === profile?.primaryTeacherId) return true;

  return false;
}

/**
 * Resolves the student IDs associated with the calling user — students
 * for whom they are the parent, the primary teacher, or an assigned
 * teacher (via `teacher_assignments`). Used by `QuotaService.listQuotas`
 * to scope IDOR-vulnerable list queries so a `QUOTAS_VIEW` caller only
 * sees their own students' quotas.
 *
 * Returns an empty array if the user is neither a parent nor a teacher.
 */
export async function resolveAssociatedStudentIds(actorUserId: string): Promise<string[]> {
  const [parent, teacher] = await Promise.all([
    ParentRepository.findByUserId(actorUserId),
    TeacherRepository.findByUserId(actorUserId),
  ]);

  if (!parent && !teacher) return [];

  const orConditions: ReturnType<typeof eq>[] = [];
  if (parent) {
    orConditions.push(eq(students.parentId, parent.id));
  }
  if (teacher) {
    orConditions.push(eq(students.primaryTeacherId, teacher.id));
  }

  const rows = await db
    .select({ id: students.id })
    .from(students)
    .where(or(...orConditions));

  const studentIds = new Set(rows.map(r => r.id));

  if (teacher) {
    const assignedRows = await db
      .select({ studentId: teacherAssignments.studentId })
      .from(teacherAssignments)
      .where(eq(teacherAssignments.teacherId, teacher.id));
    for (const r of assignedRows) {
      studentIds.add(r.studentId);
    }
  }

  return [...studentIds];
}

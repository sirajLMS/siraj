import { ParentRepository, StudentRepository, TeacherRepository } from "@/backend/db/repo";
import { AppPermission } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { ErrorsLabels } from "@/shared/locale";

/**
 * V3-011: Shared permission guard extracted from the duplicated
 * `requirePermission` functions in `quota.service.ts` and `credit.service.ts`.
 * Checks that `actorUserId` is present and holds the given `AppPermission`.
 * Throws a localized error on failure.
 */
export async function requirePermission(
  actorUserId: string,
  permission: AppPermission,
  tErrors: ErrorsLabels
): Promise<void> {
  const hasPermission = await PermissionsService.hasPermission(actorUserId, permission);
  if (!hasPermission) {
    throw new Error(tErrors.insufficientPermissions);
  }
}

/**
 * V3-013: Shared IDOR-scoping check extracted from the duplicated
 * blocks in `quota.service.ts` and `credit.service.ts`. Verifies that
 * the caller is the student themselves, the student's parent, the
 * student's primary teacher, or holds the given manage permission
 * (default `QUOTAS_MANAGE`; callers can pass `CREDITS_MANAGE` for
 * credit endpoints). Throws a localized error on failure.
 */
export async function assertAssociatedOrManage(
  uid: string,
  studentId: string,
  tErrors: ErrorsLabels,
  managePermission: AppPermission = AppPermission.QUOTAS_MANAGE
): Promise<void> {
  const isAssociated = await resolveAssociatedViewer(uid, studentId);
  const hasManage = await PermissionsService.hasPermission(uid, managePermission);
  if (!isAssociated && !hasManage) {
    throw new Error(tErrors.insufficientPermissions);
  }
}

/**
 * Resolves whether the calling user is associated with the given student —
 * as the student themselves, the student's parent, or the student's primary
 * teacher. Used to scope IDOR-vulnerable reads so a caller with QUOTAS_VIEW
 * can only access their own students' data; admins/teachers with
 * QUOTAS_MANAGE bypass via the permission check.
 *
 * The parent and teacher lookups are independent of each other, so they run
 * in parallel via `Promise.all` to reduce sequential query latency. The
 * student-self check uses the profile already fetched before those lookups.
 */
export async function resolveAssociatedViewer(actorUserId: string, studentId: string): Promise<boolean> {
  const profile = await StudentRepository.findProfileById(studentId);
  if (!profile) return false;

  // (b) The user IS the student themselves
  if (profile.userId === actorUserId) return true;

  const [parent, teacher] = await Promise.all([
    ParentRepository.findByUserId(actorUserId),
    TeacherRepository.findByUserId(actorUserId),
  ]);

  // (a) The user is the student's parent
  if (parent?.id === profile.parentId) return true;
  // The user is the student's primary teacher
  if (teacher?.id === profile.primaryTeacherId) return true;

  return false;
}

/**
 * Resolves the student IDs associated with the calling user — students
 * for whom they are the student themselves, the parent, the primary
 * teacher, or an assigned teacher (via `teacher_assignments`). Used by
 * `QuotaService.listQuotas` to scope IDOR-vulnerable list queries so a
 * `QUOTAS_VIEW` caller only sees their own students' quotas.
 *
 * V3-023: Delegates to `StudentRepository.findIdsByParentOrTeacher`
 * instead of running raw `db.select()` queries against the `students`
 * and `teacher_assignments` tables.
 *
 * Returns an empty array if the user is neither a student, a parent,
 * nor a teacher.
 */
export async function resolveAssociatedStudentIds(actorUserId: string): Promise<string[]> {
  const [parent, teacher, ownStudentId] = await Promise.all([
    ParentRepository.findByUserId(actorUserId),
    TeacherRepository.findByUserId(actorUserId),
    StudentRepository.getStudentIdByUserId(actorUserId),
  ]);

  const studentIds: string[] = [];

  // (b) The user IS a student — include their own student ID
  if (ownStudentId) {
    studentIds.push(ownStudentId);
  }

  if (!parent && !teacher && studentIds.length === 0) return [];

  const associatedIds = await StudentRepository.findIdsByParentOrTeacher(parent?.id ?? null, teacher?.id ?? null);
  const merged = new Set([...studentIds, ...associatedIds]);

  return [...merged];
}

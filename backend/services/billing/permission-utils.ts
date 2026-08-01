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
 * the caller is either associated with the student (parent or primary
 * teacher) or holds the given manage permission (default `QUOTAS_MANAGE`,
 * callers can pass `CREDITS_MANAGE` for credit endpoints). Throws a
 * localized error on failure.
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
 * V3-023: Delegates to `StudentRepository.findIdsByParentOrTeacher`
 * instead of running raw `db.select()` queries against the `students`
 * and `teacher_assignments` tables.
 *
 * Returns an empty array if the user is neither a parent nor a teacher.
 */
export async function resolveAssociatedStudentIds(actorUserId: string): Promise<string[]> {
  const [parent, teacher] = await Promise.all([
    ParentRepository.findByUserId(actorUserId),
    TeacherRepository.findByUserId(actorUserId),
  ]);

  if (!parent && !teacher) return [];

  return StudentRepository.findIdsByParentOrTeacher(parent?.id ?? null, teacher?.id ?? null);
}

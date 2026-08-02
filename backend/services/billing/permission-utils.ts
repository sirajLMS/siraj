import { ParentRepository, StudentRepository, TeacherRepository } from "@/backend/db/repo";
import { AppPermission } from "@/backend/enum";
import { ForbiddenError } from "@/backend/lib/errors";
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
    throw new ForbiddenError(tErrors.insufficientPermissions);
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
    throw new ForbiddenError(tErrors.insufficientPermissions);
  }
}

// Cache for request-level memoization on resolveAssociatedViewer.
// Key format: "actorUserId:studentId". Reduces repeated DB lookups for
// the same (caller, student) pair within a single request scope and limits
// the surface for student enumeration via brute-force calls.
const viewerCache = new Map<string, boolean>();

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
  const cacheKey = `${actorUserId}:${studentId}`;
  const cached = viewerCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const profile = await StudentRepository.findProfileById(studentId);
  if (!profile) {
    viewerCache.set(cacheKey, false);
    return false;
  }

  // (b) The user IS the student themselves
  if (profile.userId === actorUserId) {
    viewerCache.set(cacheKey, true);
    return true;
  }

  const [parent, teacher] = await Promise.all([
    ParentRepository.findByUserId(actorUserId),
    TeacherRepository.findByUserId(actorUserId),
  ]);

  // (a) The user is the student's parent
  if (parent?.id === profile.parentId) {
    viewerCache.set(cacheKey, true);
    return true;
  }
  // The user is the student's primary teacher
  if (teacher?.id === profile.primaryTeacherId) {
    viewerCache.set(cacheKey, true);
    return true;
  }

  viewerCache.set(cacheKey, false);
  return false;
}

// Cache for request-level memoization on resolveAssociatedStudentIds.
// Key: actorUserId. Avoids redundant parent/teacher/student-self lookups
// for the same user within a single request scope.
const studentIdsCache = new Map<string, string[]>();

/**
 * Resolves the student IDs associated with the calling user — students
 * for whom they are the student themselves, the parent, the primary
 * teacher, or an assigned teacher (via `teacher_assignments`). Used by
 * `QuotaService.listQuota` to scope IDOR-vulnerable list queries so a
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
  const cachedIds = studentIdsCache.get(actorUserId);
  if (cachedIds !== undefined) {
    return [...cachedIds];
  }

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

  if (!parent && !teacher && studentIds.length === 0) {
    studentIdsCache.set(actorUserId, []);
    return [];
  }

  const associatedIds = await StudentRepository.findIdsByParentOrTeacher(parent?.id ?? null, teacher?.id ?? null);
  const merged = [...new Set([...studentIds, ...associatedIds])];

  studentIdsCache.set(actorUserId, merged);
  return [...merged];
}

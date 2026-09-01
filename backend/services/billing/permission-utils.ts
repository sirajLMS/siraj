import { ParentRepository } from "@/backend/db/repo/parents";
import { StudentRepository } from "@/backend/db/repo/students";
import { TeacherRepository } from "@/backend/db/repo/teachers";
import { AppPermission } from "@/backend/enum";
import { ForbiddenError } from "@/backend/lib/errors";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { cachedRead } from "@/backend/services/cache";
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

// H2 fix: association cache via `cachedRead` (tag-indexed) so invalidation
// actually works. The prior direct-cacheService.get/set approach cached reads
// correctly but its invalidation helpers deleted a literal prefix key
// (`billing:viewer:${userId}:`) that never existed (per-student keys are
// `billing:viewer:${userId}:${studentId}`), making invalidation a no-op.
// Tag-based invalidation drops every key tagged `user:${userId}` in one call.
const VIEWER_CACHE_TTL_SECONDS = 60;
const VIEWER_CACHE_PREFIX = "billing:viewer:";

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
 * Result is cached with tags `user:${actorUserId}` + `student:${studentId}`
 * so reassignment/revocation invalidates within the TTL window.
 */
export async function resolveAssociatedViewer(actorUserId: string, studentId: string): Promise<boolean> {
  return cachedRead(
    `${VIEWER_CACHE_PREFIX}${actorUserId}:${studentId}`,
    VIEWER_CACHE_TTL_SECONDS,
    async () => {
      const profile = await StudentRepository.findProfileById(studentId);
      if (!profile) return false;
      if (profile.userId === actorUserId) return true;
      const [parent, teacher] = await Promise.all([
        ParentRepository.findByUserId(actorUserId),
        TeacherRepository.findByUserId(actorUserId),
      ]);
      // Null-normalizing BOTH sides would make a caller with no parent/teacher
      // row "match" every student that has no primaryTeacherId assigned yet
      // (null === null). Absence must never count as an association.
      const matchesAsParent = parent !== null && parent.id === profile.parentId;
      const matchesAsTeacher =
        teacher !== null && profile.primaryTeacherId !== null && teacher.id === profile.primaryTeacherId;
      return matchesAsParent || matchesAsTeacher;
    },
    [`user:${actorUserId}`, `student:${studentId}`]
  );
}

// H2 fix: TTL'd student-IDs cache via `cachedRead` (tag-indexed on
// `user:${actorUserId}`) so invalidation actually drops the entry.
const STUDENT_IDS_CACHE_TTL_SECONDS = 60;
const STUDENT_IDS_CACHE_PREFIX = "billing:studentIds:";

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
 * nor a teacher. Result is cached with tag `user:${actorUserId}`.
 */
export async function resolveAssociatedStudentIds(actorUserId: string): Promise<string[]> {
  return cachedRead(
    `${STUDENT_IDS_CACHE_PREFIX}${actorUserId}`,
    STUDENT_IDS_CACHE_TTL_SECONDS,
    async () => {
      const [parent, teacher, ownStudentId] = await Promise.all([
        ParentRepository.findByUserId(actorUserId),
        TeacherRepository.findByUserId(actorUserId),
        StudentRepository.getStudentIdByUserId(actorUserId),
      ]);

      const studentIds: string[] = [];
      if (ownStudentId) studentIds.push(ownStudentId);
      if (!parent && !teacher && studentIds.length === 0) return [];

      const associatedIds = await StudentRepository.findIdsByParentOrTeacher(parent?.id ?? null, teacher?.id ?? null);
      return [...new Set([...studentIds, ...associatedIds])];
    },
    [`user:${actorUserId}`]
  );
}

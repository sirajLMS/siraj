import { ParentRepository } from "@/backend/db/repo/parents";
import { StudentRepository } from "@/backend/db/repo/students";
import { TeacherRepository } from "@/backend/db/repo/teachers";
import { AppPermission } from "@/backend/enum";
import { ForbiddenError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { cacheService } from "@/backend/services/cache/CacheServiceFactory";
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

// M3 fix: TTL'd association cache via cacheService (Redis/Postgres) instead of
// a permanent in-memory Map. Prevents revoked teachers/parents from retaining
// access until process restart. TTL: 60 seconds.
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
 */
export async function resolveAssociatedViewer(actorUserId: string, studentId: string): Promise<boolean> {
  const cacheKey = `${VIEWER_CACHE_PREFIX}${actorUserId}:${studentId}`;
  try {
    const cached = await cacheService.get(cacheKey);
    if (cached !== null) {
      return cached === "1";
    }
  } catch {
    // Cache miss/failure is non-fatal — fall through to DB lookup.
  }

  const profile = await StudentRepository.findProfileById(studentId);
  if (!profile) {
    await setViewerCacheSafe(cacheKey, false);
    return false;
  }

  // (b) The user IS the student themselves
  if (profile.userId === actorUserId) {
    await setViewerCacheSafe(cacheKey, true);
    return true;
  }

  const [parent, teacher] = await Promise.all([
    ParentRepository.findByUserId(actorUserId),
    TeacherRepository.findByUserId(actorUserId),
  ]);

  // (a) The user is the student's parent
  if ((parent?.id ?? null) === profile.parentId) {
    await setViewerCacheSafe(cacheKey, true);
    return true;
  }
  // The user is the student's primary teacher
  if ((teacher?.id ?? null) === profile.primaryTeacherId) {
    await setViewerCacheSafe(cacheKey, true);
    return true;
  }

  await setViewerCacheSafe(cacheKey, false);
  return false;
}

/** Best-effort cache set — never throws (cache failures are non-fatal). */
async function setViewerCacheSafe(cacheKey: string, value: boolean): Promise<void> {
  try {
    await cacheService.set(cacheKey, value ? "1" : "0", { ex: VIEWER_CACHE_TTL_SECONDS });
  } catch (err) {
    logger.warn("Failed to set viewer cache entry", { cacheKey, err: String(err) });
  }
}

// M3 fix: TTL'd student-IDs cache via cacheService instead of permanent Map.
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
 * nor a teacher.
 */
export async function resolveAssociatedStudentIds(actorUserId: string): Promise<string[]> {
  const cacheKey = `${STUDENT_IDS_CACHE_PREFIX}${actorUserId}`;
  try {
    const cached = await cacheService.get(cacheKey);
    if (cached !== null) {
      return cached ? JSON.parse(cached) : [];
    }
  } catch {
    // Cache miss/failure is non-fatal — fall through to DB lookup.
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
    await setStudentIdsCacheSafe(cacheKey, []);
    return [];
  }

  const associatedIds = await StudentRepository.findIdsByParentOrTeacher(parent?.id ?? null, teacher?.id ?? null);
  const merged = [...new Set([...studentIds, ...associatedIds])];

  await setStudentIdsCacheSafe(cacheKey, merged);
  return [...merged];
}

/** Best-effort cache set — never throws. */
async function setStudentIdsCacheSafe(cacheKey: string, value: string[]): Promise<void> {
  try {
    await cacheService.set(cacheKey, JSON.stringify(value), { ex: STUDENT_IDS_CACHE_TTL_SECONDS });
  } catch (err) {
    logger.warn("Failed to set studentIds cache entry", { cacheKey, err: String(err) });
  }
}

/**
 * M3 fix: invalidation hooks called when a teacher/parent is reassigned or
 * deactivated. Clears the TTL'd cache entries so the next access re-queries
 * the DB instead of using stale association data.
 */
export async function invalidateTeacherViewerCache(actorUserId: string): Promise<void> {
  try {
    await cacheService.del(`${VIEWER_CACHE_PREFIX}${actorUserId}:`);
    await cacheService.del(`${STUDENT_IDS_CACHE_PREFIX}${actorUserId}`);
  } catch (err) {
    logger.warn("Failed to invalidate teacher cache", { actorUserId, err: String(err) });
  }
}

export async function invalidateParentViewerCache(actorUserId: string): Promise<void> {
  try {
    await cacheService.del(`${VIEWER_CACHE_PREFIX}${actorUserId}:`);
    await cacheService.del(`${STUDENT_IDS_CACHE_PREFIX}${actorUserId}`);
  } catch (err) {
    logger.warn("Failed to invalidate parent cache", { actorUserId, err: String(err) });
  }
}

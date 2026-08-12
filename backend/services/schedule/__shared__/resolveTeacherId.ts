import { TeacherRepository } from "@/backend/db/repo/teachers/teacher.repository";
import { AppPermission } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { ErrorsLabels } from "@/shared/locale";

/**
 * Resolves the effective teacher ID for a schedule query.
 *
 * - If the caller has admin-level schedule permissions and a specific
 *   `requestedTeacherId` was supplied, that ID is returned directly.
 * - Otherwise the caller's own teacher record is looked up by user ID.
 * - If neither path yields a teacher, an `unauthorizedAction` error is
 *   thrown (locale-aware via `tErrors`).
 *
 * The `requestedTeacherId` union is widened to `string | null | undefined`
 * so both call sites (`string | null` and `string | undefined`) can share
 * the same helper.
 */
export async function resolveTeacherId(
  userId: string,
  requestedTeacherId: string | null | undefined,
  tErrors: ErrorsLabels
): Promise<string> {
  const isAdmin = await PermissionsService.hasAnyPermission(userId, [
    AppPermission.STAFF_VIEW_DIRECTORY,
    AppPermission.SCHEDULE_VIEW_ALL,
  ]);

  if (isAdmin && requestedTeacherId) {
    return requestedTeacherId;
  }

  const actorTeacher = await TeacherRepository.findByUserId(userId);
  if (actorTeacher) {
    return actorTeacher.id;
  }

  throw new Error(tErrors.unauthorizedAction);
}

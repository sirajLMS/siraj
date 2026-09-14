import { ParentRepository } from "@/backend/db/repo/parents";
import { StudentRepository } from "@/backend/db/repo/students";
import { TeacherRepository } from "@/backend/db/repo/teachers";
import { AppPermission } from "@/backend/enum";
import { ForbiddenError } from "@/backend/lib/errors";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { ErrorsLabels } from "@/shared/locale";

export async function resolveIsAssociatedViewer(actorUserId: string, studentId: string): Promise<boolean> {
  const profile = await StudentRepository.findProfileById(studentId);
  if (!profile) {
    return false;
  }

  // LMS — Student login accounts can view their own profile.
  if (profile.userId === actorUserId) {
    return true;
  }

  const parent = await ParentRepository.findByUserId(actorUserId);
  if (parent !== null && parent.id === profile.parentId) {
    return true;
  }

  const teacher = await TeacherRepository.findByUserId(actorUserId);
  if (teacher !== null && profile.primaryTeacherId === teacher.id) {
    return true;
  }

  return false;
}

export async function assertStudentReadAccess(
  actorUserId: string,
  studentId: string,
  tErrors: ErrorsLabels
): Promise<void> {
  if (await resolveIsAssociatedViewer(actorUserId, studentId)) {
    return;
  }

  const canViewOther = await PermissionsService.hasAnyPermission(actorUserId, [
    AppPermission.STUDENT_IDENTITY_VIEW_OTHER,
    AppPermission.STUDENT_ACADEMIC_VIEW_OTHER,
  ]);
  if (canViewOther) {
    return;
  }

  throw new ForbiddenError(tErrors.insufficientPermissions);
}

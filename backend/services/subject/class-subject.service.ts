import { ClassSubjectRepository } from "@/backend/db/repo/classes/class-subject.repository";
import { SubjectResourceRepository } from "@/backend/db/repo/classes/subject-resource.repository";
import { AppPermission } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type {
  ClassSubjectReturnType,
  ClassSubjectSubmitInput,
  ClassSubjectUpdateInput,
  SubjectResourceAttachInput,
  SubjectResourceReturnType,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale/types/errors";

export namespace ClassSubjectService {
  async function assertPermission(userId: string, permission: AppPermission, tErrors: ErrorsLabels): Promise<void> {
    const hasPermission = await PermissionsService.hasPermission(userId, permission);
    if (!hasPermission) {
      throw new Error(
        tErrors.insufficientPermissions
      );
    }
  }

  export async function listSubjects(
    userId: string,
    tErrors: ErrorsLabels,
    categoryId?: string,
  ): Promise<ClassSubjectReturnType[]> {
    await assertPermission(userId, AppPermission.SUBJECTS_LIST, tErrors);

    return await ClassSubjectRepository.listSubjects(categoryId);
  }

  export async function getSubjectById(
    userId: string,
    id: string,
    tErrors: ErrorsLabels
  ): Promise<ClassSubjectReturnType> {
    await assertPermission(userId, AppPermission.SUBJECTS_LIST, tErrors);

    return await ClassSubjectRepository.getSubjectById(id);
  }

  export async function createSubject(
    userId: string,
    input: ClassSubjectSubmitInput,
    tErrors: ErrorsLabels
  ): Promise<ClassSubjectReturnType> {
    await assertPermission(userId, AppPermission.SUBJECTS_CREATE, tErrors);

    return await ClassSubjectRepository.createSubject(input);
  }

  export async function updateSubject(
    userId: string,
    id: string,
    input: ClassSubjectUpdateInput,
    tErrors: ErrorsLabels
  ): Promise<ClassSubjectReturnType> {
    await assertPermission(userId, AppPermission.SUBJECTS_UPDATE, tErrors);

    return await ClassSubjectRepository.updateSubject(id, input);
  }

  export async function deleteSubject(userId: string, id: string, tErrors: ErrorsLabels): Promise<{ id: string }> {
    await assertPermission(userId, AppPermission.SUBJECTS_DELETE, tErrors);

    return await ClassSubjectRepository.deleteSubject(id);
  }

  export async function getSubjectResources(
    userId: string,
    subjectId: string,
    tErrors: ErrorsLabels
  ): Promise<SubjectResourceReturnType[]> {
    await assertPermission(userId, AppPermission.SUBJECTS_VIEW_RESOURCES, tErrors);

    return await SubjectResourceRepository.listResourcesForSubject(subjectId);
  }

  export async function attachResource(
    userId: string,
    input: SubjectResourceAttachInput,
    tErrors: ErrorsLabels
  ): Promise<SubjectResourceReturnType> {
    await assertPermission(userId, AppPermission.SUBJECTS_MANAGE_RESOURCES, tErrors);

    return await SubjectResourceRepository.attachResource(input);
  }

  export async function detachResource(
    userId: string,
    subjectId: string,
    learningResourceId: string,
    tErrors: ErrorsLabels
  ): Promise<{ id: string }> {
    await assertPermission(userId, AppPermission.SUBJECTS_MANAGE_RESOURCES, tErrors);

    return await SubjectResourceRepository.detachResource(subjectId, learningResourceId);
  }
}

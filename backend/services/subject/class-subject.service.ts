import { ClassSubjectRepository } from "@/backend/db/repo/classes/class-subject.repository";
import { SubjectResourceRepository } from "@/backend/db/repo/classes/subject-resource.repository";
import { AppPermission } from "@/backend/enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type {
  ClassSubjectReturnType,
  ClassSubjectSubmitInput,
  ClassSubjectUpdateInput,
  SubjectResourceAttachInput,
  SubjectResourceReturnType,
} from "@/backend/types";

export namespace ClassSubjectService {
  async function assertPermission(userId: string, permission: AppPermission, locale?: string): Promise<void> {
    const hasPermission = await PermissionsService.hasPermission(userId, permission);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("unauthorizedAction"));
    }
  }

  export async function listSubjects(
    userId: string,
    categoryId?: string,
    locale?: string
  ): Promise<ClassSubjectReturnType[]> {
    await assertPermission(userId, AppPermission.SUBJECTS_LIST, locale);

    return await ClassSubjectRepository.listSubjects(categoryId);
  }

  export async function getSubjectById(userId: string, id: string, locale?: string): Promise<ClassSubjectReturnType> {
    await assertPermission(userId, AppPermission.SUBJECTS_LIST, locale);

    return await ClassSubjectRepository.getSubjectById(id, locale);
  }

  export async function createSubject(
    userId: string,
    input: ClassSubjectSubmitInput,
    locale?: string
  ): Promise<ClassSubjectReturnType> {
    await assertPermission(userId, AppPermission.SUBJECTS_CREATE, locale);

    return await ClassSubjectRepository.createSubject(input, locale);
  }

  export async function updateSubject(
    userId: string,
    id: string,
    input: ClassSubjectUpdateInput,
    locale?: string
  ): Promise<ClassSubjectReturnType> {
    await assertPermission(userId, AppPermission.SUBJECTS_UPDATE, locale);

    return await ClassSubjectRepository.updateSubject(id, input, locale);
  }

  export async function deleteSubject(userId: string, id: string, locale?: string): Promise<{ id: string }> {
    await assertPermission(userId, AppPermission.SUBJECTS_DELETE, locale);

    return await ClassSubjectRepository.deleteSubject(id, locale);
  }

  export async function getSubjectResources(
    userId: string,
    subjectId: string,
    locale?: string
  ): Promise<SubjectResourceReturnType[]> {
    await assertPermission(userId, AppPermission.SUBJECTS_VIEW_RESOURCES, locale);

    return await SubjectResourceRepository.listResourcesForSubject(subjectId);
  }

  export async function attachResource(
    userId: string,
    input: SubjectResourceAttachInput,
    locale?: string
  ): Promise<SubjectResourceReturnType> {
    await assertPermission(userId, AppPermission.SUBJECTS_MANAGE_RESOURCES, locale);

    return await SubjectResourceRepository.attachResource(input, locale);
  }

  export async function detachResource(
    userId: string,
    subjectId: string,
    learningResourceId: string,
    locale?: string
  ): Promise<{ id: string }> {
    await assertPermission(userId, AppPermission.SUBJECTS_MANAGE_RESOURCES, locale);

    return await SubjectResourceRepository.detachResource(subjectId, learningResourceId, locale);
  }
}

import { ClassSubjectRepository } from "@/backend/db/repo/class-subject.repository";
import { SubjectResourceRepository } from "@/backend/db/repo/subject-resource.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type {
  ClassSubjectReturnType,
  ClassSubjectSubmitInput,
  ClassSubjectUpdateInput,
  SubjectResourceReturnType,
} from "@/backend/types";
import { AppPermission } from "@/shared/lib/enum";

export namespace ClassSubjectService {
  export async function listSubjects(
    userId: string,
    categoryId?: string,
    locale?: string
  ): Promise<ClassSubjectReturnType[]> {
    const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.SUBJECTS_LIST);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("unauthorizedAction"));
    }

    return await ClassSubjectRepository.listSubjects(categoryId);
  }

  export async function getSubjectById(userId: string, id: string, locale?: string): Promise<ClassSubjectReturnType> {
    const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.SUBJECTS_LIST);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("unauthorizedAction"));
    }

    return await ClassSubjectRepository.getSubjectById(id, locale);
  }

  export async function createSubject(
    userId: string,
    input: ClassSubjectSubmitInput,
    locale?: string
  ): Promise<ClassSubjectReturnType> {
    const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.SUBJECTS_CREATE);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("unauthorizedAction"));
    }

    return await ClassSubjectRepository.createSubject(input, locale);
  }

  export async function updateSubject(
    userId: string,
    id: string,
    input: ClassSubjectUpdateInput,
    locale?: string
  ): Promise<ClassSubjectReturnType> {
    const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.SUBJECTS_UPDATE);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("unauthorizedAction"));
    }

    return await ClassSubjectRepository.updateSubject(id, input, locale);
  }

  export async function deleteSubject(userId: string, id: string, locale?: string): Promise<{ id: string }> {
    const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.SUBJECTS_DELETE);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("unauthorizedAction"));
    }

    return await ClassSubjectRepository.deleteSubject(id, locale);
  }

  export async function getSubjectResources(
    userId: string,
    subjectId: string,
    locale?: string
  ): Promise<SubjectResourceReturnType[]> {
    const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.SUBJECTS_VIEW_RESOURCES);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("unauthorizedAction"));
    }

    return await SubjectResourceRepository.listResourcesForSubject(subjectId);
  }

  export async function attachResource(
    userId: string,
    input: import("@/backend/types").SubjectResourceAttachInput,
    locale?: string
  ): Promise<SubjectResourceReturnType> {
    const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.SUBJECTS_MANAGE_RESOURCES);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("unauthorizedAction"));
    }

    return await SubjectResourceRepository.attachResource(input, locale);
  }

  export async function detachResource(
    userId: string,
    subjectId: string,
    learningResourceId: string,
    locale?: string
  ): Promise<{ id: string }> {
    const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.SUBJECTS_MANAGE_RESOURCES);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("unauthorizedAction"));
    }

    return await SubjectResourceRepository.detachResource(subjectId, learningResourceId, locale);
  }
}

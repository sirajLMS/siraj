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
import type { ErrorsLabels } from "@/shared/locale";

const EMPTY_RESOURCES: SubjectResourceReturnType[] = [];
const EMPTY_RESOURCES_MAP: Map<string, SubjectResourceReturnType[]> = new Map();

export namespace ClassSubjectService {
  async function assertPermission(userId: string, permission: AppPermission, tErrors: ErrorsLabels): Promise<void> {
    const hasPermission = await PermissionsService.hasPermission(userId, permission);
    if (!hasPermission) {
      throw new Error(tErrors.insufficientPermissions);
    }
  }

  function buildSubjectReturnType<T extends { id: string }>(
    subject: T,
    resourcesBySubjectId: Map<string, SubjectResourceReturnType[]>
  ): T & { resources: SubjectResourceReturnType[] } {
    return {
      ...subject,
      resources: resourcesBySubjectId.get(subject.id) ?? EMPTY_RESOURCES,
    };
  }

  async function fetchSubjectWithResources(id: string): Promise<ClassSubjectReturnType> {
    const subject = await ClassSubjectRepository.getSubjectById(id);
    const resourcesBySubjectId = await SubjectResourceRepository.loadResourcesBySubjectIds([id]);
    return buildSubjectReturnType(subject, resourcesBySubjectId);
  }

  export async function listSubjects(
    userId: string,
    tErrors: ErrorsLabels,
    categoryId?: string
  ): Promise<ClassSubjectReturnType[]> {
    await assertPermission(userId, AppPermission.SUBJECTS_LIST, tErrors);

    const subjects = await ClassSubjectRepository.listSubjects(categoryId);

    const subjectIds = subjects.map(s => s.id);
    const resourcesBySubjectId = await SubjectResourceRepository.loadResourcesBySubjectIds(subjectIds);

    return subjects.map(s => buildSubjectReturnType(s, resourcesBySubjectId));
  }

  export async function getSubjectById(
    userId: string,
    id: string,
    tErrors: ErrorsLabels
  ): Promise<ClassSubjectReturnType> {
    await assertPermission(userId, AppPermission.SUBJECTS_LIST, tErrors);

    return fetchSubjectWithResources(id);
  }

  export async function createSubject(
    userId: string,
    input: ClassSubjectSubmitInput,
    tErrors: ErrorsLabels
  ): Promise<ClassSubjectReturnType> {
    await assertPermission(userId, AppPermission.SUBJECTS_CREATE, tErrors);
    return buildSubjectReturnType(await ClassSubjectRepository.createSubject(input), EMPTY_RESOURCES_MAP);
  }

  export async function updateSubject(
    userId: string,
    id: string,
    input: ClassSubjectUpdateInput,
    tErrors: ErrorsLabels
  ): Promise<ClassSubjectReturnType> {
    await assertPermission(userId, AppPermission.SUBJECTS_UPDATE, tErrors);
    await ClassSubjectRepository.updateSubject(id, input);
    return fetchSubjectWithResources(id);
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

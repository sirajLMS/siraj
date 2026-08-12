import { ClassCategoryRepository } from "@/backend/db/repo/classes/class-category.repository";
import { ClassSubjectRepository } from "@/backend/db/repo/classes/class-subject.repository";
import { SubjectResourceRepository } from "@/backend/db/repo/classes/subject-resource.repository";
import type {
  ClassCategoryReturnType,
  ClassCategorySubmitInput,
  ClassSubjectReturnType,
  ClassSubjectSubmitInput,
  DBTransaction,
  SubjectResourceAttachInput,
  SubjectResourceReturnType,
} from "@/backend/types";

export namespace ClassCatalogService {
  // ─── Bootstrap / Seeder Operations (no auth) ──────────────────────────────

  export async function findCategoriesBySlugs(
    slugs: readonly string[],
    tx?: DBTransaction
  ): Promise<ClassCategoryReturnType[]> {
    return ClassCategoryRepository.findBySlugs(slugs, tx);
  }

  export async function upsertManyCategories(
    inputs: readonly ClassCategorySubmitInput[],
    tx?: DBTransaction
  ): Promise<ClassCategoryReturnType[]> {
    return ClassCategoryRepository.upsertMany(inputs, tx);
  }

  export async function findSubjectsBySlugs(
    slugs: readonly string[],
    tx?: DBTransaction
  ): Promise<ClassSubjectReturnType[]> {
    return ClassSubjectRepository.findBySlugs(slugs, tx);
  }

  export async function upsertManySubjects(
    inputs: readonly ClassSubjectSubmitInput[],
    tx?: DBTransaction
  ): Promise<ClassSubjectReturnType[]> {
    return ClassSubjectRepository.upsertMany(inputs, tx);
  }

  export async function createManySubjectResources(
    inputs: readonly SubjectResourceAttachInput[],
    tx?: DBTransaction
  ): Promise<SubjectResourceReturnType[]> {
    return SubjectResourceRepository.createMany(inputs, tx);
  }

  export async function loadResourcesBySubjectIds(
    subjectIds: readonly string[],
    tx?: DBTransaction
  ): Promise<Map<string, SubjectResourceReturnType[]>> {
    return SubjectResourceRepository.loadResourcesBySubjectIds([...subjectIds], tx);
  }
}

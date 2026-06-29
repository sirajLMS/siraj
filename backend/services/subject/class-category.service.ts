import { ClassCategoryRepository } from "@/backend/db/repo/class-category.repository";
import { ClassSubjectRepository } from "@/backend/db/repo/class-subject.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { ClassCategoryReturnType, ClassCategorySubmitInput, ClassCategoryUpdateInput } from "@/backend/types";
import { AppPermission } from "@/shared/lib/enum";

export namespace ClassCategoryService {
  export async function listCategories(userId: string, locale?: string): Promise<ClassCategoryReturnType[]> {
    const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.SUBJECTS_LIST);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("unauthorizedAction"));
    }

    return await ClassCategoryRepository.listCategories();
  }

  export async function getCategoryById(userId: string, id: string, locale?: string): Promise<ClassCategoryReturnType> {
    const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.SUBJECTS_LIST);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("unauthorizedAction"));
    }

    return await ClassCategoryRepository.getCategoryById(id, locale);
  }

  export async function createCategory(
    userId: string,
    input: ClassCategorySubmitInput,
    locale?: string
  ): Promise<ClassCategoryReturnType> {
    const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.CATEGORIES_CREATE);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("unauthorizedAction"));
    }

    return await ClassCategoryRepository.createCategory(input, locale);
  }

  export async function updateCategory(
    userId: string,
    id: string,
    input: ClassCategoryUpdateInput,
    locale?: string
  ): Promise<ClassCategoryReturnType> {
    const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.CATEGORIES_UPDATE);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("unauthorizedAction"));
    }

    return await ClassCategoryRepository.updateCategory(id, input, locale);
  }

  export async function deleteCategory(userId: string, id: string, locale?: string): Promise<{ id: string }> {
    const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.CATEGORIES_DELETE);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("unauthorizedAction"));
    }

    const subjects = await ClassSubjectRepository.listSubjects(id);
    if (subjects.length > 0) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("categoryHasSubjects"));
    }

    return await ClassCategoryRepository.deleteCategory(id, locale);
  }
}

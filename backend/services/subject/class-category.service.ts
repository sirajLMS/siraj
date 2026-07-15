import { ClassCategoryRepository } from "@/backend/db/repo/classes/class-category.repository";
import { ClassSubjectRepository } from "@/backend/db/repo/classes/class-subject.repository";
import { AppPermission } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { ClassCategoryReturnType, ClassCategorySubmitInput, ClassCategoryUpdateInput } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale/types/errors";

export namespace ClassCategoryService {
  export async function listCategories(userId: string, tErrors: ErrorsLabels): Promise<ClassCategoryReturnType[]> {
    const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.SUBJECTS_LIST);
    if (!hasPermission) {
      throw new Error(tErrors.unauthorizedAction ?? "You are not authorized to perform this action.");
    }

    return await ClassCategoryRepository.listCategories();
  }

  export async function getCategoryById(
    userId: string,
    id: string,
    tErrors: ErrorsLabels
  ): Promise<ClassCategoryReturnType> {
    const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.SUBJECTS_LIST);
    if (!hasPermission) {
      throw new Error(tErrors.unauthorizedAction ?? "You are not authorized to perform this action.");
    }

    return await ClassCategoryRepository.getCategoryById(id, tErrors);
  }

  export async function createCategory(
    userId: string,
    input: ClassCategorySubmitInput,
    tErrors: ErrorsLabels
  ): Promise<ClassCategoryReturnType> {
    const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.CATEGORIES_CREATE);
    if (!hasPermission) {
      throw new Error(tErrors.unauthorizedAction ?? "You are not authorized to perform this action.");
    }

    return await ClassCategoryRepository.createCategory(input, tErrors);
  }

  export async function updateCategory(
    userId: string,
    id: string,
    input: ClassCategoryUpdateInput,
    tErrors: ErrorsLabels
  ): Promise<ClassCategoryReturnType> {
    const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.CATEGORIES_UPDATE);
    if (!hasPermission) {
      throw new Error(tErrors.unauthorizedAction ?? "You are not authorized to perform this action.");
    }

    return await ClassCategoryRepository.updateCategory(id, input, tErrors);
  }

  export async function deleteCategory(userId: string, id: string, tErrors: ErrorsLabels): Promise<{ id: string }> {
    const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.CATEGORIES_DELETE);
    if (!hasPermission) {
      throw new Error(tErrors.unauthorizedAction ?? "You are not authorized to perform this action.");
    }

    const subjects = await ClassSubjectRepository.listSubjects(id);
    if (subjects.length > 0) {
      throw new Error(tErrors.categoryHasSubjects ?? "Category has subjects and cannot be deleted.");
    }

    return await ClassCategoryRepository.deleteCategory(id, tErrors);
  }
}

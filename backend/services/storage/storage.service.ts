import { StorageDbRepository } from "@/backend/db/repo";
import { getBackendTranslations } from "@/backend/lib/intl";
import logger from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type {
  DirectoryPermissionsUpdateInput,
  FileOperationResult,
  StorageItemProtectionUpdateInput,
} from "@/backend/types";
import { AppPermission } from "@/shared/lib/enum";

export namespace StorageAuthService {
  /**
   * Require that the user has STORAGE_MANAGE permission.
   * Throws a localized error if the user lacks the permission.
   */
  export async function requireStorageManage(userId: string, locale?: string): Promise<void> {
    const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.STORAGE_MANAGE);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }
  }

  /**
   * Require that the user has STORAGE_MANAGE permission OR is an owner of the file.
   * Ownership is determined by checking file usages for a user reference.
   * Throws a localized error if neither condition is met.
   */
  export async function requireStorageManageOrOwner(userId: string, filePath: string, locale?: string): Promise<void> {
    const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.STORAGE_MANAGE);
    if (hasPermission) return;

    const usages = await StorageDbRepository.getFileUsages(filePath);
    const isOwner = usages.some(u => u.referenceTable === "users" && u.referenceId === userId);
    if (!isOwner) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }
  }
}

export namespace StorageManageService {
  /**
   * Update directory permissions.
   * Delegates to the repository after the caller has verified authorization.
   */
  export async function updateDirectoryPermissions(
    input: DirectoryPermissionsUpdateInput
  ): Promise<FileOperationResult> {
    logger.info("Updating directory permissions", { path: input.path });
    return await StorageDbRepository.updateDirectoryPermissions(input);
  }

  /**
   * Set protection status on a storage item (file or directory).
   * Delegates to the repository after the caller has verified authorization.
   */
  export async function setStorageItemProtection(
    input: StorageItemProtectionUpdateInput
  ): Promise<FileOperationResult> {
    logger.info("Setting storage item protection", { path: input.path, isProtected: input.isProtected });
    return await StorageDbRepository.setProtection(input);
  }
}

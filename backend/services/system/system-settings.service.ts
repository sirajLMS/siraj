import { SystemSettingsRepository } from "@/backend/db/repo/shared/system-settings.repository";
import { AppPermission } from "@/backend/enum";
import logger from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { getStorageService } from "@/backend/storage/storage.service";
import type { ErrorsLabels } from "@/shared/locale";

const HANDBOOK_SETTING_KEY = "teacher_handbook_url";
const PARENT_HANDBOOK_SETTING_KEY = "parent_handbook_url";

export namespace SystemSettingsService {
  /**
   * Retrieves the signed, secure download URL for the teacher handbook.
   *
   * Checks if the user is authorized as a teacher (TEACHER_VIEW_DASHBOARD permission)
   * or as an administrator (TEACHERS_EDIT permission).
   * It fetches the stored file path from the "teacher_handbook_url" system settings record,
   * then delegates to the active storage provider to retrieve a signed download URL.
   *
   * @param userId The ID of the user requesting the handbook URL.
   * @param tErrors Translated error labels.
   * @returns A promise resolving to the signed download URL.
   */
  export async function getHandbookDownloadUrl(userId: string, tErrors: ErrorsLabels): Promise<string> {
    const isTeacher = await PermissionsService.hasPermission(userId, AppPermission.TEACHER_VIEW_DASHBOARD);
    const isAdmin = await PermissionsService.hasPermission(userId, AppPermission.TEACHERS_EDIT);
    if (!isTeacher && !isAdmin) {
      throw new Error(tErrors.unauthorizedAction);
    }

    const setting = await SystemSettingsRepository.getByKey(HANDBOOK_SETTING_KEY);
    if (!setting?.value) {
      throw new Error(tErrors.notFound);
    }

    const path = setting.value;

    const storageService = await getStorageService();
    const fileInfo = await storageService.fileInfoByPath(path);
    if (!fileInfo?.url) {
      throw new Error(tErrors.notFound);
    }

    return fileInfo.url;
  }

  export async function getParentHandbookDownloadUrl(userId: string, tErrors: ErrorsLabels): Promise<string> {
    const isParent = await PermissionsService.hasPermission(userId, AppPermission.SCHEDULE_VIEW_FAMILY);
    const isAdmin = await PermissionsService.hasPermission(userId, AppPermission.PARENTS_EDIT);
    if (!isParent && !isAdmin) {
      throw new Error(tErrors.unauthorizedAction);
    }

    const setting = await SystemSettingsRepository.getByKey(PARENT_HANDBOOK_SETTING_KEY);
    if (!setting?.value) {
      throw new Error(tErrors.notFound);
    }

    const path = setting.value;
    const storageService = await getStorageService();
    const fileInfo = await storageService.fileInfoByPath(path);
    if (!fileInfo?.url) {
      throw new Error(tErrors.notFound);
    }

    return fileInfo.url;
  }

  export async function uploadParentHandbook(
    userId: string | null,
    fileName: string,
    fileBuffer: Buffer,
    tErrors: ErrorsLabels
  ): Promise<void> {
    if (userId) {
      const isAuthorized = await PermissionsService.hasPermission(userId, AppPermission.RESOURCES_UPLOAD);
      const isAdmin = await PermissionsService.hasPermission(userId, AppPermission.PARENTS_EDIT);
      if (!isAuthorized && !isAdmin) {
        throw new Error(tErrors.unauthorizedAction);
      }
    }

    const bucketPath = `public/docs/${fileName || "parent-handbook.pdf"}`;
    logger.info(`Uploading parent handbook to storage path: ${bucketPath}`);
    const storageService = await getStorageService();
    const uploadResult = await storageService.uploadFile(bucketPath, "application/pdf", fileBuffer);
    if (!uploadResult.success) {
      throw new Error(`Failed to upload parent handbook: ${uploadResult.message}`);
    }

    await SystemSettingsRepository.upsertSetting({
      key: PARENT_HANDBOOK_SETTING_KEY,
      value: bucketPath,
      dataType: "string",
      description: "Default download URL for the parent handbook",
      category: "system",
      updatedByUserId: userId,
    });
  }

  /**
   * Uploads or updates the teacher handbook file in storage and registers its path in the database.
   *
   * Checks if the user has resource upload permissions (RESOURCES_UPLOAD or TEACHERS_EDIT)
   * if a `userId` is provided. If `userId` is `null`, it allows system-level bypass (e.g. database seeding).
   * It uploads the file buffer to `public/docs/[fileName]`, and then updates or inserts the path into
   * the system settings table with the key "teacher_handbook_url".
   *
   * @param userId The user ID of the actor initiating the upload, or `null` for system-level bypass.
   * @param fileName The desired filename (e.g. "teacher-handbook.pdf").
   * @param fileBuffer The raw PDF file buffer.
   * @param tErrors Translated error labels.
   */
  export async function uploadHandbook(
    userId: string | null,
    fileName: string,
    fileBuffer: Buffer,
    tErrors: ErrorsLabels
  ): Promise<void> {
    if (userId) {
      const isAuthorized = await PermissionsService.hasPermission(userId, AppPermission.RESOURCES_UPLOAD);
      const isAdmin = await PermissionsService.hasPermission(userId, AppPermission.TEACHERS_EDIT);
      if (!isAuthorized && !isAdmin) {
        throw new Error(tErrors.unauthorizedAction);
      }
    }

    const bucketPath = `public/docs/${fileName || "teacher-handbook.pdf"}`;

    logger.info(`Uploading teacher handbook to storage path: ${bucketPath}`);
    const storageService = await getStorageService();
    const uploadResult = await storageService.uploadFile(bucketPath, "application/pdf", fileBuffer);
    if (!uploadResult.success) {
      throw new Error(`Failed to upload teacher handbook: ${uploadResult.message}`);
    }

    logger.info("Registering teacher handbook in system settings...");
    await SystemSettingsRepository.upsertSetting({
      key: HANDBOOK_SETTING_KEY,
      value: bucketPath,
      dataType: "string",
      description: "Default download URL for the teacher handbook",
      category: "system",
      updatedByUserId: userId,
    });
  }

  /**
   * Deletes the teacher handbook file from storage and removes its registry path from system settings.
   *
   * Checks if the user has delete permissions (RESOURCES_DELETE or TEACHERS_EDIT)
   * if a `userId` is provided. If `userId` is `null`, it allows system-level bypass.
   * It fetches the registered path, deletes the actual file from the storage provider, and
   * deletes the setting record from the system settings repository.
   *
   * @param userId The user ID of the actor initiating the deletion, or `null` for system-level bypass.
   * @param tErrors Translated error labels.
   */
  export async function deleteHandbook(userId: string | null, tErrors: ErrorsLabels): Promise<void> {
    if (userId) {
      const isAuthorized = await PermissionsService.hasPermission(userId, AppPermission.RESOURCES_DELETE);
      const isAdmin = await PermissionsService.hasPermission(userId, AppPermission.TEACHERS_EDIT);
      if (!isAuthorized && !isAdmin) {
        throw new Error(tErrors.unauthorizedAction);
      }
    }

    const setting = await SystemSettingsRepository.getByKey(HANDBOOK_SETTING_KEY);
    if (!setting?.value) {
      logger.warn("Teacher handbook setting does not exist; skipping deletion.");
      return;
    }

    const path = setting.value;

    logger.info(`Deleting teacher handbook from storage path: ${path}`);
    const storageService = await getStorageService();
    const deleteResult = await storageService.deleteFile(path);
    if (!deleteResult.success) {
      logger.error(`Failed to delete teacher handbook file from storage: ${deleteResult.message}`);
    }

    logger.info("Deleting teacher handbook from system settings repository...");
    await SystemSettingsRepository.deleteSetting(HANDBOOK_SETTING_KEY);
  }

  export type SystemSettingUpsertInput = {
    key: string;
    value: string;
    dataType?: "string" | "integer";
    description: string;
    category: "security" | "system" | "scheduling" | "communication";
  };

  export async function upsertManySettings(inputs: SystemSettingUpsertInput[], updatedByUserId: string | null = null) {
    const results = [];
    for (const input of inputs) {
      const row = await SystemSettingsRepository.upsertSetting({
        ...input,
        updatedByUserId,
      });
      results.push(row);
    }
    return results;
  }
}

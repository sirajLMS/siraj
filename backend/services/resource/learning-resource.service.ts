import { LearningResourceRepository } from "@/backend/db/repo/storage/learning-resource.repository";
import { AppPermission } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { getStorageService } from "@/backend/storage/storage.service";
import type {
  LearningResourceListResult,
  LearningResourceReturnType,
  LearningResourceSubmitInput,
} from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

export namespace LearningResourceService {
  /**
   * Lists non-deleted learning resources ordered by creation date DESC.
   * Requires `resources.list` permission.
   */
  export async function listResources(
    actorUserId: string,
    _searchQuery?: string | null,
    locale?: string
  ): Promise<LearningResourceListResult> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.RESOURCES_LIST);
    if (!hasPermission) {
      const t = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(t.unauthorizedAction);
    }

    return await LearningResourceRepository.listResources();
  }

  /**
   * Creates a new learning resource record with file association.
   * Requires `resources.upload` permission.
   * Verifies the file exists in storage before creating the resource.
   */
  export async function createResource(
    actorUserId: string,
    input: LearningResourceSubmitInput,
    locale?: string
  ): Promise<LearningResourceReturnType> {
    const t = getServerTranslations(locale ?? "ar").errorsTranslations;

    // Step 0: Validate input
    if (!input.displayName || input.displayName.trim() === "") {
      throw new Error(t.invalidInput);
    }

    // Step 1: Verify upload permission
    const hasUploadPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.RESOURCES_UPLOAD);
    if (!hasUploadPermission) {
      throw new Error(t.unauthorizedAction);
    }

    // Step 2: Verify file exists in storage
    const storageService = await getStorageService();
    const fileInfo = await storageService.fileInfoByPath(input.filePath);
    if (!fileInfo) {
      throw new Error(t.notFound);
    }

    // Step 3: Create resource within transaction (repo handles atomicity)
    const result = await LearningResourceRepository.createResource(
      {
        displayName: input.displayName,
        filePath: input.filePath,
        uploadedByUserId: actorUserId,
        fileId: input.fileId,
      },
      locale
    );

    logger.info("Learning resource created", {
      resourceId: result.id,
      fileName: result.displayName,
      actorUserId,
    });

    return result;
  }

  /**
   * Checks whether an actor has permission to access a specific resource file.
   * Implements the `system.restrict_resource_access` enforcement.
   * Returns true only when the resource exists and the actor has `resources.list` permission.
   */
  export async function checkAccess(actorUserId: string, resourceId: string): Promise<boolean> {
    const resource = await LearningResourceRepository.findById(resourceId);
    if (!resource) {
      return false;
    }

    return await PermissionsService.hasPermission(actorUserId, AppPermission.RESOURCES_LIST);
  }

  /**
   * Orchestrates the complete deletion lifecycle of a learning resource.
   *
   * @description
   * This method acts as the centralized authority for dropping learning resources.
   * It enforces RBAC security checks to ensure the calling user has the right to perform
   * this destructive action. It then carefully orchestrates the physical storage cleanup
   * followed by the database cleanup to prevent orphaned files.
   *
   * @param resourceId - The unique UUID of the learning resource to delete.
   * @param actorUserId - The unique UUID of the user attempting the deletion.
   * @param locale - The optional locale for error translation.
   * @returns Promise<boolean> - Returns true if the entire deletion process succeeded.
   * @throws Error("unauthorizedAction") - If the user lacks the 'resources.delete' permission.
   * @throws Error - If the file cannot be deleted from physical storage or the database.
   */
  export async function deleteResource(resourceId: string, actorUserId: string, locale?: string): Promise<boolean> {
    try {
      logger.info(
        `[LearningResourceService.deleteResource] Initiating deletion of resource ${resourceId} by user ${actorUserId}`
      );

      const t = getServerTranslations(locale ?? "ar").errorsTranslations;

      // 1. Core Permission Check
      const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.RESOURCES_DELETE);

      if (!hasPermission) {
        logger.warn(
          `[LearningResourceService.deleteResource] Unauthorized deletion attempt by user ${actorUserId} for resource ${resourceId}`
        );
        throw new Error(t.unauthorizedAction);
      }

      // 2. Resource Retrieval
      const resource = await LearningResourceRepository.findById(resourceId);
      if (!resource) {
        logger.warn(`[LearningResourceService.deleteResource] Resource ID not found: ${resourceId}`);
        throw new Error(t.resourceNotFound);
      }

      logger.debug(`[LearningResourceService.deleteResource] Resource fetched. Target file path: ${resource.filePath}`);

      // 3. Physical Storage Cleanup
      logger.debug(`[LearningResourceService.deleteResource] Requesting StorageRepository to drop physical file.`);
      const storageService = await getStorageService();
      await storageService.deleteFile(resource.filePath);

      // 4. Database Cleanup
      logger.debug(
        `[LearningResourceService.deleteResource] Physical file deleted. Requesting LearningResourceRepository to drop DB record.`
      );
      await LearningResourceRepository.deleteResource(resourceId, locale);

      logger.info(`[LearningResourceService.deleteResource] Deletion lifecycle complete for resource ${resourceId}`);
      return true;
    } catch (error) {
      logger.error(
        `[LearningResourceService.deleteResource] Failed to orchestrate deletion for resource ${resourceId}:`,
        error
      );
      const t = getServerTranslations(locale ?? "ar").errorsTranslations;
      if (error instanceof Error && (error.message === t.unauthorizedAction || error.message === t.resourceNotFound)) {
        throw error;
      }
      throw new Error(t.resource.resourceDeleteFailed, { cause: error });
    }
  }

  // ─── Bootstrap / Seeder Operations (no auth) ──────────────────────────────

  export async function findByFilePath(filePath: string) {
    return LearningResourceRepository.findByFilePath(filePath);
  }

  export async function insertResource(input: {
    displayName: string;
    filePath: string;
    uploadedByUserId: string;
    createdAt?: Date;
  }) {
    return LearningResourceRepository.insertResource(input);
  }
}

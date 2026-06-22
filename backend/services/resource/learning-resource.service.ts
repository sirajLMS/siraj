import type { LearningResourceListResult, LearningResourceRow } from "@/backend/db/repo/learning-resource.repository";
import { LearningResourceRepository } from "@/backend/db/repo/learning-resource.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { getStorageService } from "@/backend/storage/storage.service";
import { AppPermission } from "@/shared/lib/enum";

export interface CreateResourceInput {
  readonly displayName: string;
  readonly filePath: string;
  readonly fileId: string;
}

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
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("unauthorizedAction"));
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
    input: CreateResourceInput,
    locale?: string
  ): Promise<LearningResourceRow> {
    const t = await getBackendTranslations({ locale, namespace: "errors" });

    // Step 1: Verify upload permission
    const hasUploadPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.RESOURCES_UPLOAD);
    if (!hasUploadPermission) {
      throw new Error(t("unauthorizedAction"));
    }

    // Step 2: Verify file exists in storage
    const storageService = await getStorageService();
    const fileInfo = await storageService.fileInfoByPath(input.filePath);
    if (!fileInfo) {
      throw new Error(t("notFound"));
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
}

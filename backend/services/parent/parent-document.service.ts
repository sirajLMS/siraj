import { StorageDbRepository } from "@/backend/db/repo";
import { AppPermission } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { getServerTranslations } from "@/shared/locale/server-graphql";

export interface ParentDocumentRow {
  readonly id: string;
  readonly fileId: string;
  readonly filePath: string;
  readonly isProtected: boolean;
  readonly usageType: string;
  readonly createdAt: Date;
}

export interface LinkedDocumentResult {
  readonly id: string;
  readonly fileId: string;
  readonly parentId: string;
  readonly usageType: string;
  readonly createdAt: Date;
}

export namespace ParentDocumentService {
  /**
   * Lists all documents linked to a parent record.
   * Requires: document.manage_parent_docs permission.
   */
  export async function getParentDocuments(
    actorUserId: string,
    parentId: string,
    locale?: string
  ): Promise<ParentDocumentRow[]> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.DOCUMENT_MANAGE_PARENT_DOCS
    );
    if (!hasPermission) {
      const tFunc = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(tFunc.insufficientPermissions);
    }

    return StorageDbRepository.getFilesForParent(parentId);
  }

  /**
   * Links an already-uploaded file to a parent's document record.
   * Requires: document.manage_parent_docs permission.
   * @param fileId - ID of a file that was previously uploaded via the signed-URL flow
   * @param usageType - e.g., "contract", "id_verification"
   */
  export async function linkDocumentToParent(
    actorUserId: string,
    parentId: string,
    fileId: string,
    usageType: string,
    locale?: string
  ): Promise<LinkedDocumentResult> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.DOCUMENT_MANAGE_PARENT_DOCS
    );
    if (!hasPermission) {
      const tFunc = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(tFunc.insufficientPermissions);
    }

    if (!fileId || typeof fileId !== "string") {
      throw new Error("invalidFileId");
    }

    return StorageDbRepository.linkFileToParent(parentId, fileId, usageType);
  }
}

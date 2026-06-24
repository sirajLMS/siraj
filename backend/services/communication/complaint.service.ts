import {
  ComplaintRepository,
  ComplaintResponseRepository,
  ParentRepository,
  SoftDeleteRepository,
  StorageDbRepository,
  SystemSettingsRepository,
} from "@/backend/db/repo";
import { getBackendTranslations, logger } from "@/backend/lib";
import { PermissionsService } from "@/backend/services";
import type {
  ComplaintFileReturnType,
  ComplaintQueueFilter,
  ComplaintReturnType,
  ComplaintSelectType,
  ComplaintSubmitInput,
  FileMetadata,
} from "@/backend/types";
import { AppPermission } from "@/shared/lib/enum";

export namespace ComplaintService {
  export async function getParentIdForComplaints(actorUserId: string, locale?: string): Promise<string> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.SUPPORT_SUBMIT_COMPLAINT);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    const parent = await ParentRepository.findByUserId(actorUserId);
    if (!parent) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("parentNotFound", { userId: actorUserId }));
    }

    return parent.id;
  }

  export async function submitComplaint(
    actorUserId: string,
    input: ComplaintSubmitInput & { files?: ReadonlyArray<FileMetadata> },
    locale?: string
  ): Promise<ComplaintSelectType> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.SUPPORT_SUBMIT_COMPLAINT);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    const parent = await ParentRepository.findByUserId(actorUserId);
    if (!parent) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("parentNotFound", { userId: actorUserId }));
    }

    if (input.studentId) {
      const student = await ParentRepository.getAssociatedStudentById(input.studentId);
      if (!student) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("studentNotFound", { id: input.studentId }));
      }
    }

    const files = input.files ?? [];
    if (files.length > 0) {
      await validateComplaintFiles(files, locale);
    }

    try {
      const created = await ComplaintRepository.submitComplaint(
        {
          studentId: input.studentId ?? null,
          category: input.category,
          submitterEmail: input.submitterEmail,
          body: input.body,
        },
        parent.id,
        undefined,
        locale
      );

      if (files.length > 0) {
        for (const file of files) {
          await StorageDbRepository.registerFileUsage(
            {
              referenceTable: "complaints",
              referenceId: created.id,
              usageType: "attachment",
              filePath: file.path,
            },
            locale
          );
        }
      }

      logger.info("Complaint submitted", {
        actorUserId,
        complaintId: created.id,
        parentId: parent.id,
        category: input.category,
        fileCount: files.length,
      });

      return created;
    } catch (error) {
      logger.error("Failed to submit complaint", { actorUserId, error });
      throw error;
    }
  }

  export async function getParentComplaints(actorUserId: string, locale?: string): Promise<ComplaintReturnType[]> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.SUPPORT_VIEW_HISTORY);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    const parent = await ParentRepository.findByUserId(actorUserId);
    if (!parent) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("parentNotFound", { userId: actorUserId }));
    }

    try {
      const complaints = await ComplaintRepository.getComplaintsByParent(parent.id);
      const results: ComplaintReturnType[] = [];

      for (const complaint of complaints) {
        const responses = await ComplaintResponseRepository.getResponsesByComplaint(complaint.id);
        results.push({
          id: complaint.id,
          parentId: complaint.parentId,
          studentId: complaint.studentId,
          category: complaint.category,
          submitterEmail: complaint.submitterEmail,
          body: complaint.body,
          status: complaint.status,
          createdAt: complaint.createdAt,
          updatedAt: complaint.updatedAt,
          studentName: complaint.studentName,
          responses: responses,
        });
      }

      return results;
    } catch (error) {
      logger.error("Failed to get parent complaints", { actorUserId, parentId: parent.id, error });
      throw error;
    }
  }

  export async function getAdminQueue(
    actorUserId: string,
    options: ComplaintQueueFilter,
    locale?: string
  ): Promise<{ complaints: ReadonlyArray<ComplaintReturnType> }> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.COMPLAINTS_LIST);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    try {
      const result = await ComplaintRepository.getComplaintQueue({
        limit: options.limit,
        offset: options.offset,
        status: options.status ?? null,
        search: options.search ?? null,
      });

      return {
        complaints: result.complaints,
      };
    } catch (error) {
      logger.error("Failed to get admin complaint queue", { actorUserId, options, error });
      throw error;
    }
  }

  export async function getQueueWithMetrics(
    actorUserId: string,
    options: ComplaintQueueFilter,
    locale?: string
  ): Promise<{
    complaints: ReadonlyArray<ComplaintReturnType>;
    metrics: { id: string; unanswered: number; answered: number; avgResolutionHours: number; totalCount: number };
  }> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.COMPLAINTS_LIST);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    try {
      const [queueResult, metrics] = await Promise.all([
        ComplaintRepository.getComplaintQueue({
          limit: options.limit,
          offset: options.offset,
          status: options.status ?? null,
          search: options.search ?? null,
        }),
        ComplaintRepository.getComplaintMetrics(),
      ]);

      return {
        complaints: queueResult.complaints,
        metrics: {
          id: "complaint-metrics",
          unanswered: metrics.unanswered,
          answered: metrics.answered,
          avgResolutionHours: metrics.avgResolutionHours,
          totalCount: queueResult.metrics.totalCount,
        },
      };
    } catch (error) {
      logger.error("Failed to get admin complaint queue with metrics", { actorUserId, options, error });
      throw error;
    }
  }

  export async function deleteComplaint(
    actorUserId: string,
    complaintId: string,
    locale?: string
  ): Promise<{ readonly deletedAt: string }> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.COMPLAINTS_DELETE);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    try {
      const result = await SoftDeleteRepository.softDeleteComplaint(complaintId, actorUserId);

      logger.info("Complaint soft-deleted", {
        actorUserId,
        complaintId,
        deletedAt: result.deletedAt,
      });

      return {
        deletedAt: result.deletedAt.toISOString(),
      };
    } catch (error) {
      logger.error("Failed to delete complaint", { actorUserId, complaintId, error });
      throw error;
    }
  }

  export async function getComplaintFiles(
    actorUserId: string,
    complaintId: string,
    locale?: string
  ): Promise<ReadonlyArray<ComplaintFileReturnType>> {
    const canListComplaints = await PermissionsService.hasPermission(actorUserId, AppPermission.COMPLAINTS_LIST);
    const canViewHistory = await PermissionsService.hasPermission(actorUserId, AppPermission.SUPPORT_VIEW_HISTORY);

    if (!canListComplaints && !canViewHistory) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    const complaint = await ComplaintRepository.getComplaintById(complaintId);
    if (!complaint) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("complaintNotFound", { id: complaintId }));
    }

    if (!canListComplaints) {
      const parent = await ParentRepository.findByUserId(actorUserId);
      if (!parent || parent.id !== complaint.parentId) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("insufficientPermissions"));
      }
    }

    try {
      const files = await ComplaintRepository.getComplaintFiles(complaintId);

      logger.info("Complaint files retrieved", {
        actorUserId,
        complaintId,
        fileCount: files.length,
      });

      return files;
    } catch (error) {
      logger.error("Failed to get complaint files", { actorUserId, complaintId, error });
      throw error;
    }
  }
}

async function validateComplaintFiles(files: ReadonlyArray<FileMetadata>, locale?: string): Promise<void> {
  const tFunc = await getBackendTranslations({ locale, namespace: "errors" });

  const maxFiles = await SystemSettingsRepository.getIntValue("complaint_max_files_per_complaint", 5);
  if (files.length > maxFiles) {
    throw new Error(tFunc("complaint.tooManyFiles", { max: maxFiles }));
  }

  const maxSizeMb = await SystemSettingsRepository.getIntValue("complaint_max_file_size_mb", 25);
  const maxSizeBytes = maxSizeMb * 1024 * 1024;

  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown",
  ];

  for (const file of files) {
    if (file.sizeBytes > maxSizeBytes) {
      throw new Error(tFunc("complaint.fileTooLarge", { max: maxSizeMb }));
    }

    if (!allowedMimeTypes.includes(file.mimeType)) {
      throw new Error(tFunc("complaint.invalidFileType", { allowed: allowedMimeTypes.join(", ") }));
    }
  }
}

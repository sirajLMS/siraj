import { ComplaintRepository, ComplaintResponseRepository } from "@/backend/db/repo/complaints";
import { ParentRepository } from "@/backend/db/repo/parents";
import { SoftDeleteRepository, SystemSettingsRepository } from "@/backend/db/repo/shared";
import { StorageDbRepository } from "@/backend/db/repo/storage";
import { AppPermission } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services";
import {
  assertPermission,
  requireParentByActorUserId,
  softDeleteEntityLog,
} from "@/backend/services/communication/__shared__/complaintSuggestionBase";
import { dispatchWithPreferences } from "@/backend/services/notification/notification-dispatch.helpers";
import { buildNewComplaintPayloads } from "@/backend/services/notification/notification-payloads.builders";
import type {
  ComplaintFileReturnType,
  ComplaintQueueFilter,
  ComplaintQueuePaginatedResult,
  ComplaintReturnType,
  ComplaintSelectType,
  ComplaintSubmitInput,
  FileMetadata,
  PaginationArgs,
  ParentComplaintPaginatedResult,
} from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

async function dispatchNewComplaint(complaint: ComplaintSelectType, locale?: string): Promise<void> {
  const reviewerUserIds = await PermissionsService.getUserIdsWithPermission(AppPermission.COMPLAINTS_LIST);
  if (reviewerUserIds.length === 0) return;

  const payloads = buildNewComplaintPayloads(complaint.id, reviewerUserIds, locale, {
    category: complaint.category,
  });
  await dispatchWithPreferences(payloads, reviewerUserIds, locale).catch(err => {
    logger.error("New-complaint notification dispatch failed", {
      complaintId: complaint.id,
      err,
    });
  });
}

export namespace ComplaintService {
  export async function getParentIdForComplaints(actorUserId: string, locale?: string): Promise<string> {
    const parent = await requireParentByActorUserId(actorUserId, AppPermission.SUPPORT_SUBMIT_COMPLAINT, locale);
    return parent.id;
  }

  export async function submitComplaint(
    actorUserId: string,
    input: ComplaintSubmitInput & { files?: ReadonlyArray<FileMetadata> },
    locale?: string
  ): Promise<ComplaintSelectType> {
    const parent = await requireParentByActorUserId(actorUserId, AppPermission.SUPPORT_SUBMIT_COMPLAINT, locale);

    if (input.studentId) {
      const student = await ParentRepository.getAssociatedStudentById(input.studentId);
      if (!student) {
        const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
        throw new Error(tErrors.studentNotFound(input.studentId));
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
        await Promise.all(
          files.map(file =>
            StorageDbRepository.registerFileUsage(
              {
                referenceTable: "complaints",
                referenceId: created.id,
                usageType: "attachment",
                filePath: file.path,
              },
              locale
            )
          )
        );
      }

      logger.info("Complaint submitted", {
        actorUserId,
        complaintId: created.id,
        parentId: parent.id,
        category: created.category,
        fileCount: files.length,
      });

      await dispatchNewComplaint(created, locale);

      return created;
    } catch (error) {
      logger.error("Failed to submit complaint", { actorUserId, error });
      throw error;
    }
  }

  export async function getParentComplaints(
    actorUserId: string,
    pagination: PaginationArgs | null = null,
    locale?: string
  ): Promise<ParentComplaintPaginatedResult> {
    const parent = await requireParentByActorUserId(actorUserId, AppPermission.SUPPORT_VIEW_HISTORY, locale);

    try {
      const result = await ComplaintRepository.getComplaintsByParent(parent.id, pagination);
      const complaintIds = result.complaints.map(c => c.id);
      const responsesMap = await ComplaintResponseRepository.getResponsesByComplaints(complaintIds);
      const complaints: ComplaintReturnType[] = [];

      for (const complaint of result.complaints) {
        complaints.push({
          id: complaint.id,
          category: complaint.category,
          body: complaint.body,
          status: complaint.status,
          createdAt: complaint.createdAt,
          updatedAt: complaint.updatedAt,
          studentName: complaint.studentName,
          responses: responsesMap.get(complaint.id) ?? [],
        });
      }

      return {
        id: result.id,
        complaints,
        totalCount: result.totalCount,
        pageInfo: result.pageInfo,
      };
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
    await assertPermission(actorUserId, AppPermission.COMPLAINTS_LIST, locale);

    try {
      const result = await ComplaintRepository.getComplaintQueuePaginated(
        {
          status: options.status ?? null,
          search: options.search ?? null,
        },
        null
      );

      return {
        complaints: result.rows,
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
    id: string;
    complaints: ReadonlyArray<ComplaintReturnType>;
    metrics: { id: string; unanswered: number; answered: number; avgResolutionHours: number; totalCount: number };
  }> {
    await assertPermission(actorUserId, AppPermission.COMPLAINTS_LIST, locale);

    try {
      const [queueResult, metrics] = await Promise.all([
        ComplaintRepository.getComplaintQueuePaginated(
          {
            status: options.status ?? null,
            search: options.search ?? null,
          },
          null
        ),
        ComplaintRepository.getComplaintMetrics(),
      ]);

      return {
        id: "complaint-queue-result",
        complaints: queueResult.rows,
        metrics: {
          id: "complaint-metrics",
          unanswered: metrics.unanswered,
          answered: metrics.answered,
          avgResolutionHours: metrics.avgResolutionHours,
          totalCount: queueResult.totalCount,
        },
      };
    } catch (error) {
      logger.error("Failed to get admin complaint queue with metrics", { actorUserId, options, error });
      throw error;
    }
  }

  export async function getQueueWithMetricsPaginated(
    actorUserId: string,
    options: ComplaintQueueFilter,
    paginationArgs: PaginationArgs | null,
    locale?: string
  ): Promise<{
    id: string;
    rows: ComplaintQueuePaginatedResult["rows"];
    totalCount: number;
    pageInfo: ComplaintQueuePaginatedResult["pageInfo"];
    metrics: { id: string; unanswered: number; answered: number; avgResolutionHours: number; totalCount: number };
  }> {
    await assertPermission(actorUserId, AppPermission.COMPLAINTS_LIST, locale);

    try {
      const [paginatedResult, metrics] = await Promise.all([
        ComplaintRepository.getComplaintQueuePaginated(
          {
            status: options.status ?? null,
            search: options.search ?? null,
          },
          paginationArgs
        ),
        ComplaintRepository.getComplaintMetrics(),
      ]);

      const complaintIds = paginatedResult.rows.map(r => r.id);
      const responsesMap = await ComplaintResponseRepository.getResponsesByComplaints(complaintIds);

      const rowsWithResponses = paginatedResult.rows.map(row => ({
        ...row,
        responses: responsesMap.get(row.id) ?? [],
      }));

      return {
        id: "complaint-queue-result",
        rows: rowsWithResponses,
        totalCount: paginatedResult.totalCount,
        pageInfo: paginatedResult.pageInfo,
        metrics: {
          id: "complaint-metrics",
          unanswered: metrics.unanswered,
          answered: metrics.answered,
          avgResolutionHours: metrics.avgResolutionHours,
          totalCount: paginatedResult.totalCount,
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
    await assertPermission(actorUserId, AppPermission.COMPLAINTS_DELETE, locale);

    return softDeleteEntityLog({
      actorUserId,
      entityLabel: "Complaint",
      idKey: "complaintId",
      entityId: complaintId,
      deleteFn: SoftDeleteRepository.softDeleteComplaint,
    });
  }

  export async function getComplaintFiles(
    actorUserId: string,
    complaintId: string,
    locale?: string
  ): Promise<ReadonlyArray<ComplaintFileReturnType>> {
    const canListComplaints = await PermissionsService.hasPermission(actorUserId, AppPermission.COMPLAINTS_LIST);
    const canViewHistory = await PermissionsService.hasPermission(actorUserId, AppPermission.SUPPORT_VIEW_HISTORY);

    if (!canListComplaints && !canViewHistory) {
      const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(tErrors.insufficientPermissions);
    }

    const complaint = await ComplaintRepository.getComplaintById(complaintId);
    if (!complaint) {
      const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(tErrors.complaintNotFound);
    }

    if (!canListComplaints) {
      const parent = await ParentRepository.findByUserId(actorUserId);
      if (parent?.id !== complaint.parentId) {
        const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
        throw new Error(tErrors.insufficientPermissions);
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
  // ─── Bootstrap / Seeder Operations (no auth) ──────────────────────────────

  export async function createManyComplaints(
    inputs: Parameters<typeof ComplaintRepository.insertComplaint>[0][]
  ): Promise<ComplaintSelectType[]> {
    return Promise.all(inputs.map(input => ComplaintRepository.insertComplaint(input)));
  }

  export async function ensureComplaintResponse(input: {
    complaintId: string;
    responderUserId: string | null;
    body: string;
    emailSent: boolean;
  }) {
    const existing = await ComplaintResponseRepository.findByComplaintId(input.complaintId);
    if (existing) {
      if (input.responderUserId && existing.responderUserId !== input.responderUserId) {
        return ComplaintResponseRepository.updateResponderUserId(existing.id, input.responderUserId);
      }
      return existing;
    }
    return ComplaintResponseRepository.insertResponse(input);
  }
}

async function validateComplaintFiles(files: ReadonlyArray<FileMetadata>, locale?: string): Promise<void> {
  const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;

  const maxFiles = await SystemSettingsRepository.getIntValue("complaint_max_files_per_complaint", 5);
  if (files.length > maxFiles) {
    throw new Error(tErrors.complaintTooManyFiles(maxFiles));
  }

  const maxSizeMb = await SystemSettingsRepository.getIntValue("complaint_max_file_size_mb", 25);
  const maxSizeBytes = maxSizeMb * 1024 * 1024;

  const allowedMimeTypes = new Set<string>([
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown",
  ]);

  for (const file of files) {
    if (file.sizeBytes > maxSizeBytes) {
      throw new Error(tErrors.complaintFileTooLarge(maxSizeMb));
    }

    if (!allowedMimeTypes.has(file.mimeType)) {
      throw new Error(tErrors.file.invalidFileType);
    }
  }
}

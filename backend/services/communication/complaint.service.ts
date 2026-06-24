import {
  ComplaintRepository,
  ComplaintResponseRepository,
  ParentRepository,
  SoftDeleteRepository,
} from "@/backend/db/repo";
import { getBackendTranslations, logger } from "@/backend/lib";
import { PermissionsService } from "@/backend/services";
import type {
  ComplaintQueueFilter,
  ComplaintReturnType,
  ComplaintSelectType,
  ComplaintSubmitInput,
} from "@/backend/types";
import { AppPermission } from "@/shared/lib/enum";

export namespace ComplaintService {
  export async function submitComplaint(
    actorUserId: string,
    input: ComplaintSubmitInput,
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

      logger.info("Complaint submitted", {
        actorUserId,
        complaintId: created.id,
        parentId: parent.id,
        category: input.category,
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
}

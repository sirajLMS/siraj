import {
  ComplaintRepository,
  ComplaintResponseRepository,
  ParentRepository,
  SoftDeleteRepository,
} from "@/backend/db/repo";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { CommunicationService } from "@/backend/services/communication/communication.service";
import { AppPermission, type ComplaintCategory, NotificationEventType } from "@/shared/lib/enum";

export interface SubmitComplaintInput {
  readonly studentId?: string | null;
  readonly category: ComplaintCategory;
  readonly body: string;
  readonly submitterEmail: string;
}

export interface ComplaintWithResponses {
  readonly id: string;
  readonly parentId: string;
  readonly studentId: string | null;
  readonly category: string;
  readonly submitterEmail: string;
  readonly body: string;
  readonly status: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly responses: ReadonlyArray<{
    readonly id: string;
    readonly complaintId: string;
    readonly responderUserId: string | null;
    readonly body: string;
    readonly emailSent: boolean;
    readonly createdAt: Date;
  }>;
}

export interface AdminQueueOptions {
  readonly limit: number;
  readonly offset: number;
  readonly statusFilter?: string | null;
  readonly search?: string | null;
}

export interface AdminQueueResult {
  readonly complaints: ReadonlyArray<{
    readonly id: string;
    readonly parentId: string;
    readonly studentId: string | null;
    readonly category: string;
    readonly submitterEmail: string;
    readonly body: string;
    readonly status: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
  }>;
  readonly totalCount: number;
}

export interface RespondToComplaintResult {
  readonly id: string;
  readonly complaintId: string;
  readonly responderUserId: string | null;
  readonly body: string;
  readonly emailSent: boolean;
  readonly createdAt: Date;
}

export namespace ComplaintService {
  export async function submitComplaint(
    actorUserId: string,
    input: SubmitComplaintInput,
    locale?: string
  ): Promise<{
    readonly id: string;
    readonly parentId: string;
    readonly studentId: string | null;
    readonly category: string;
    readonly submitterEmail: string;
    readonly body: string;
    readonly status: string;
    readonly createdAt: Date;
  }> {
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
          parentId: parent.id,
          studentId: input.studentId ?? null,
          category: input.category,
          submitterEmail: input.submitterEmail,
          body: input.body,
        },
        undefined,
        locale
      );

      logger.info("Complaint submitted", {
        actorUserId,
        complaintId: created.id,
        parentId: parent.id,
        category: input.category,
      });

      return {
        id: created.id,
        parentId: created.parentId,
        studentId: created.studentId ?? null,
        category: created.category,
        submitterEmail: created.submitterEmail,
        body: created.body,
        status: created.status,
        createdAt: created.createdAt,
      };
    } catch (error) {
      logger.error("Failed to submit complaint", { actorUserId, error });
      throw error;
    }
  }

  export async function getParentComplaints(actorUserId: string, locale?: string): Promise<ComplaintWithResponses[]> {
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

      const results: ComplaintWithResponses[] = [];
      for (const complaint of complaints) {
        const responses = await ComplaintResponseRepository.getResponsesByComplaint(complaint.id);
        results.push({
          id: complaint.id,
          parentId: complaint.parentId,
          studentId: complaint.studentId ?? null,
          category: complaint.category,
          submitterEmail: complaint.submitterEmail,
          body: complaint.body,
          status: complaint.status,
          createdAt: complaint.createdAt,
          updatedAt: complaint.updatedAt,
          responses: responses.map(r => ({
            id: r.id,
            complaintId: r.complaintId,
            responderUserId: r.responderUserId ?? null,
            body: r.body,
            emailSent: r.emailSent,
            createdAt: r.createdAt,
          })),
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
    options: AdminQueueOptions,
    locale?: string
  ): Promise<AdminQueueResult> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.COMPLAINTS_LIST);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    try {
      const result = await ComplaintRepository.getAdminComplaintQueue({
        limit: options.limit,
        offset: options.offset,
        status: options.statusFilter ?? null,
        search: options.search ?? null,
      });

      return {
        complaints: result.rows.map(c => ({
          id: c.id,
          parentId: c.parentId,
          studentId: c.studentId ?? null,
          category: c.category,
          submitterEmail: c.submitterEmail,
          body: c.body,
          status: c.status,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })),
        totalCount: result.totalCount,
      };
    } catch (error) {
      logger.error("Failed to get admin complaint queue", { actorUserId, options, error });
      throw error;
    }
  }

  export async function respondToComplaint(
    actorUserId: string,
    complaintId: string,
    body: string,
    sendEmail: boolean,
    locale?: string
  ): Promise<RespondToComplaintResult> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.COMPLAINTS_RESPOND);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    const complaint = await ComplaintRepository.getComplaintById(complaintId);
    if (!complaint) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("complaintNotFound", { id: complaintId }));
    }

    try {
      const response = await ComplaintResponseRepository.createResponse(
        {
          complaintId,
          responderUserId: actorUserId,
          body,
          emailSent: sendEmail,
        },
        undefined,
        locale
      );

      if (sendEmail) {
        await CommunicationService.dispatch(
          {
            userId: actorUserId,
            title: "Complaint Response",
            body: response.body,
            channel: "email",
            eventType: NotificationEventType.COMPLAINT_RESPONSE,
          },
          locale
        );
      }

      const parent = await ParentRepository.findByUserId(complaint.parentId);
      const notificationUserId = parent?.userId ?? actorUserId;

      await CommunicationService.dispatch(
        {
          userId: notificationUserId,
          title: "Complaint Response",
          body: response.body,
          channel: "on_app",
          eventType: NotificationEventType.COMPLAINT_RESPONSE,
        },
        locale
      );

      logger.info("Complaint response created", {
        actorUserId,
        complaintId,
        responseId: response.id,
        sendEmail,
      });

      return {
        id: response.id,
        complaintId: response.complaintId,
        responderUserId: response.responderUserId ?? null,
        body: response.body,
        emailSent: response.emailSent,
        createdAt: response.createdAt,
      };
    } catch (error) {
      logger.error("Failed to respond to complaint", { actorUserId, complaintId, error });
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

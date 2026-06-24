import { ComplaintRepository, ComplaintResponseRepository, ParentRepository } from "@/backend/db/repo";
import { getBackendTranslations, logger } from "@/backend/lib";
import { CommunicationService, PermissionsService } from "@/backend/services";
import type { ComplaintResponse, ComplaintResponseInput } from "@/backend/types";
import { AppPermission, NotificationEventType } from "@/shared/lib/enum";

export namespace ComplaintResponseService {
  export async function respondToComplaint(
    input: ComplaintResponseInput,
    responderUserId: string,
    locale?: string
  ): Promise<ComplaintResponse> {
    const { complaintId, body, emailSent } = input;
    const hasPermission = await PermissionsService.hasPermission(responderUserId, AppPermission.COMPLAINTS_RESPOND);
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
          responderUserId: responderUserId,
          body,
          emailSent: emailSent,
        },
        undefined,
        locale
      );

      if (emailSent) {
        await CommunicationService.dispatch(
          {
            userId: responderUserId,
            title: "Complaint Response",
            body: response.body,
            channel: "email",
            eventType: NotificationEventType.COMPLAINT_RESPONSE,
          },
          locale
        );
      }

      const parent = await ParentRepository.findByUserId(complaint.parentId);
      const notificationUserId = parent?.userId ?? responderUserId;

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
        actorUserId: responderUserId,
        complaintId,
        responseId: response.id,
        emailSent,
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
      logger.error("Failed to respond to complaint", { actorUserId: responderUserId, complaintId, error });
      throw error;
    }
  }
}

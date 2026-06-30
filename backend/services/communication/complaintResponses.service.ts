import { ComplaintRepository, ComplaintResponseRepository, ParentRepository } from "@/backend/db/repo";
import { getBackendTranslations, logger } from "@/backend/lib";
import { CommunicationService, PermissionsService } from "@/backend/services";
import type { ComplaintResponse, ComplaintResponseInput } from "@/backend/types";
import { AppPermission, NotificationEventType } from "@/shared/lib/enum";

type ComplaintById = NonNullable<Awaited<ReturnType<typeof ComplaintRepository.getComplaintById>>>;

async function assertCanRespondToComplaint(
  responderUserId: string,
  complaintId: string,
  locale?: string
): Promise<ComplaintById> {
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

  return complaint;
}

async function dispatchResponseNotifications(
  response: ComplaintResponse,
  complaint: ComplaintById,
  responderUserId: string,
  locale?: string
): Promise<void> {
  if (response.emailSent) {
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
}

export namespace ComplaintResponseService {
  export async function respondToComplaint(
    input: ComplaintResponseInput,
    responderUserId: string,
    locale?: string
  ): Promise<ComplaintResponse> {
    const { complaintId, body } = input;

    const complaint = await assertCanRespondToComplaint(responderUserId, complaintId, locale);

    try {
      const emailSent = false;
      const response = await ComplaintResponseRepository.createResponse(
        {
          complaintId,
          responderUserId,
          body,
          emailSent,
        },
        undefined,
        locale
      );

      await dispatchResponseNotifications(response, complaint, responderUserId, locale);

      logger.info("Complaint response created", {
        actorUserId: responderUserId,
        complaintId,
        responseId: response.id,
        emailSent,
      });

      return {
        id: response.id,
        complaintId: response.complaintId,
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

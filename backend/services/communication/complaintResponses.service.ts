import { ComplaintRepository, ComplaintResponseRepository } from "@/backend/db/repo/complaints";
import { ParentRepository } from "@/backend/db/repo/parents";
import { UserRepository } from "@/backend/db/repo/users";
import { AppPermission, NotificationChannel, NotificationEventType } from "@/backend/enum";
import { NotFoundError, UnauthorizedError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { CommunicationService } from "@/backend/services/communication/communication.service";
import type { ComplaintResponseReturnType, ComplaintResponseSubmitInput } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

type ComplaintById = NonNullable<Awaited<ReturnType<typeof ComplaintRepository.getComplaintById>>>;

async function assertCanRespondToComplaint(
  responderUserId: string,
  complaintId: string,
  locale?: string
): Promise<ComplaintById> {
  const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;

  const hasPermission = await PermissionsService.hasPermission(responderUserId, AppPermission.COMPLAINTS_RESPOND);
  if (!hasPermission) {
    throw new UnauthorizedError(tErrors.insufficientPermissions);
  }

  const complaint = await ComplaintRepository.getComplaintById(complaintId);
  if (!complaint) {
    throw new NotFoundError("COMPLAINTS", tErrors.complaintNotFound);
  }

  return complaint;
}

async function dispatchResponseNotifications(
  response: ComplaintResponseReturnType,
  complaint: ComplaintById,
  responderUserId: string,
  locale = "en"
): Promise<void> {
  const tNotifications = getServerTranslations(locale).notificationsTranslations;

  if (response.emailSent) {
    // Resolve the responder's email so the email adapter has a valid `to`.
    // The pure-payload contract is not in play here — this is
    // a legacy direct-dispatch path (F1 grandfather) — so we populate
    // `metadata.to` inline at the call site.
    const emailParent = await ParentRepository.findByUserId(complaint.parentId);
    const emailRecipientUserId = emailParent?.userId ?? responderUserId;
    const emailRecipient = await UserRepository.findSafeById(emailRecipientUserId);
    const to = emailRecipient?.email ?? "";
    if (to) {
      await CommunicationService.dispatch(
        {
          userId: emailRecipientUserId,
          title: tNotifications.complaintResponse.title,
          body: response.body,
          channel: NotificationChannel.EMAIL,
          eventType: NotificationEventType.COMPLAINT_RESPONSE,
          metadata: { to, entityKind: "complaint", entityId: complaint.id },
        },
        locale
      );
    } else {
      logger.warn("ComplaintResponse email dispatch skipped: responder has no email", {
        responderUserId,
        complaintId: complaint.id,
      });
    }
  }

  const parent = await ParentRepository.findByUserId(complaint.parentId);
  const notificationUserId = parent?.userId ?? responderUserId;

  await CommunicationService.dispatch(
    {
      userId: notificationUserId,
      title: tNotifications.complaintResponse.title,
      body: response.body,
      channel: NotificationChannel.ON_APP,
      eventType: NotificationEventType.COMPLAINT_RESPONSE,
    },
    locale
  );
}

export namespace ComplaintResponseService {
  export async function respondToComplaint(
    input: ComplaintResponseSubmitInput,
    responderUserId: string,
    locale?: string
  ): Promise<ComplaintResponseReturnType> {
    const { complaintId, body } = input;
    if (!complaintId) {
      const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new NotFoundError("COMPLAINTS", tErrors.complaintNotFound);
    }

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

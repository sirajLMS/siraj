import type {
  complaintResponses,
  complaints,
  notificationDeliveries,
  suggestions,
  userDeviceTokens,
  userNotificationPreferences,
} from "@/backend/db/schema";
import type { NotificationChannel, NotificationDeliveryStatus, NotificationEventType } from "@/shared/lib/enum";

export type UserNotificationPreferenceSelectType = typeof userNotificationPreferences.$inferSelect;
export type UserNotificationPreferenceInsertType = typeof userNotificationPreferences.$inferInsert;

export type UserDeviceTokenSelectType = typeof userDeviceTokens.$inferSelect;
export type UserDeviceTokenInsertType = typeof userDeviceTokens.$inferInsert;

export type NotificationDeliverySelectType = typeof notificationDeliveries.$inferSelect;
export type NotificationDeliveryInsertType = typeof notificationDeliveries.$inferInsert;

export type ComplaintSelectType = typeof complaints.$inferSelect;
export type ComplaintInsertType = typeof complaints.$inferInsert;

export type ComplaintResponseSelectType = typeof complaintResponses.$inferSelect;
export type ComplaintResponseInsertType = typeof complaintResponses.$inferInsert;

export type SuggestionSelectType = typeof suggestions.$inferSelect;
export type SuggestionInsertType = typeof suggestions.$inferInsert;

export type RegisterDeviceTokenInput = Pick<UserDeviceTokenInsertType, "userId" | "token" | "platform"> & {
  deviceName?: string | null;
};

export type CreateNotificationDeliveryInput = Pick<
  NotificationDeliveryInsertType,
  "userId" | "channel" | "eventType"
> & {
  deviceTokenId?: string | null;
  title?: string | null;
  body?: string | null;
};

export type UpdateDeliveryStatusInput = {
  deliveryId: string;
  status: NotificationDeliveryStatus;
  providerMessageId?: string | null;
  failureReason?: string | null;
  webhookPayload?: Record<string, unknown> | null;
};

export type NotificationDeliveryAnalyticsFilter = {
  userId?: string;
  channel?: NotificationChannel;
  eventType?: NotificationEventType;
  startDate?: Date;
  endDate?: Date;
};

export type NotificationDeliveryStatusCount = Pick<NotificationDeliverySelectType, "status"> & {
  count: number;
};

export type NotificationDeliveryAnalyticsResult = {
  totalDeliveries: number;
  statusCounts: NotificationDeliveryStatusCount[];
  openRate: number;
  failureRate: number;
};

export type ComplaintQueueRowType = {
  id: string;
  parentId: string;
  studentId: string | null;
  category: string;
  submitterEmail: string;
  body: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  parentName: string | null;
  studentName: string | null;
  responseCount: number;
};

export type ComplaintWithResponsesType = {
  id: string;
  parentId: string;
  studentId: string | null;
  category: string;
  submitterEmail: string;
  body: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  studentName: string | null;
  responses: ReadonlyArray<ComplaintResponseWithResponderType>;
};

export type ComplaintMetricsType = {
  id: string;
  unanswered: number;
  answered: number;
  avgResolutionHours: number;
};

export type AdminComplaintQueueResultType = {
  complaints: ReadonlyArray<ComplaintQueueRowType>;
  totalCount: number;
  metrics: ComplaintMetricsType;
};

export type AdminSuggestionResultType = {
  suggestions: ReadonlyArray<SuggestionSelectType>;
  totalCount: number;
  pendingCount: number;
  reviewedCount: number;
};

export type SubmitComplaintInputType = Pick<ComplaintInsertType, "studentId" | "category" | "body" | "submitterEmail">;

export type SubmitSuggestionInputType = Pick<SuggestionInsertType, "submitterName" | "body">;

export type RespondToComplaintInputType = {
  complaintId: string;
  body: string;
  sendEmail: boolean;
};

export type ComplaintResponseInputType = Pick<ComplaintResponseInsertType, "complaintId" | "body" | "emailSent"> & {
  responderUserId?: string | null;
};

export type ComplaintResponseWithResponderType = Pick<
  ComplaintResponseSelectType,
  "id" | "complaintId" | "body" | "emailSent" | "createdAt"
> & {
  responderUserId: string | null;
  responderName: string | null;
};

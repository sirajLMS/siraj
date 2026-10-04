import { NotificationChannel, NotificationEventType } from "@/frontend/common/graphql/generated/gql/graphql";

/** Alert row shape for Storybook notification rows — placeholder fixture data, not user-facing copy. */
export interface NotificationStoryAlert {
  readonly id: string;
  readonly deliveryId: string | null;
  readonly type: string;
  readonly eventType: NotificationEventType | null;
  readonly channel: NotificationChannel | null;
  readonly metadata: {
    readonly entityKind: "invoice" | "class";
    readonly entityId: string;
    readonly classInstanceId?: string;
    readonly proofPending?: boolean;
    readonly newStatus?: string;
  } | null;
  readonly title: string;
  readonly body: string | null;
  readonly createdAt: string;
  readonly severity: string;
  readonly readAt: string | null;
}

export const unreadInfoAlert: NotificationStoryAlert = {
  id: "notification-delivery-001",
  deliveryId: "delivery-001",
  type: "notification",
  eventType: NotificationEventType.ClassReminder,
  channel: NotificationChannel.OnApp,
  metadata: {
    entityKind: "class",
    entityId: "class-instance-001",
    classInstanceId: "class-instance-001",
  },
  title: "Upcoming class reminder",
  body: "Your session starts in 30 minutes.",
  createdAt: new Date().toISOString(),
  severity: "info",
  readAt: null,
};

export const classRescheduledAlert: NotificationStoryAlert = {
  id: "notification-delivery-002",
  deliveryId: "delivery-002",
  type: "notification",
  eventType: NotificationEventType.ClassRescheduled,
  channel: NotificationChannel.OnApp,
  metadata: {
    entityKind: "class",
    entityId: "class-instance-002",
    classInstanceId: "class-instance-002",
  },
  title: "Class rescheduled",
  body: "Your teacher moved the session to tomorrow at 4:00 PM.",
  createdAt: new Date(Date.now() - 3_600_000).toISOString(),
  severity: "warning",
  readAt: null,
};

export const invoiceProofPendingAlert: NotificationStoryAlert = {
  id: "notification-delivery-003",
  deliveryId: "delivery-003",
  type: "notification",
  eventType: NotificationEventType.InvoiceStatusChanged,
  channel: NotificationChannel.OnApp,
  metadata: {
    entityKind: "invoice",
    entityId: "invoice-003",
    proofPending: true,
    newStatus: "PROOF_SUBMITTED",
  },
  title: "Payment proof submitted",
  body: "A parent uploaded proof of payment for review.",
  createdAt: new Date(Date.now() - 7_200_000).toISOString(),
  severity: "info",
  readAt: null,
};

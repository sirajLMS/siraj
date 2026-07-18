import type { NotificationChannel, NotificationEventType } from "@/frontend/common/graphql/generated/gql/graphql-types";

export type NotificationEntityKind =
  | "invoice"
  | "class"
  | "student"
  | "complaint"
  | "suggestion"
  | "paymentMethod"
  | "schedule"
  | "lessonReport";

export interface NotificationMetadataBase {
  readonly entityKind: NotificationEntityKind;
  readonly entityId: string;
}

export interface InvoiceMetadata extends NotificationMetadataBase {
  readonly entityKind: "invoice";
  readonly amount?: string;
  readonly currency?: string;
  readonly newStatus?: string;
  readonly proofPending?: boolean;
}

export interface ClassMetadata extends NotificationMetadataBase {
  readonly entityKind: "class";
  readonly classInstanceId?: string;
  readonly studentName?: string;
  readonly scheduledStartAt?: string;
  readonly newStartAt?: string;
}

export interface StudentMetadata extends NotificationMetadataBase {
  readonly entityKind: "student";
  readonly studentName?: string;
  readonly oldStatus?: string;
  readonly newStatus?: string;
}

export interface ComplaintMetadata extends NotificationMetadataBase {
  readonly entityKind: "complaint";
}

export interface SuggestionMetadata extends NotificationMetadataBase {
  readonly entityKind: "suggestion";
}

export interface PaymentMethodMetadata extends NotificationMetadataBase {
  readonly entityKind: "paymentMethod";
}

export interface ScheduleMetadata extends NotificationMetadataBase {
  readonly entityKind: "schedule";
}

export interface LessonReportMetadata extends NotificationMetadataBase {
  readonly entityKind: "lessonReport";
  readonly classInstanceId?: string;
  readonly decision?: "approved" | "rejected";
}

/** Frontend mirror of backend `NotificationMetadata` discriminated union (parsed from GraphQL `metadata` JSON). */
export type NotificationMetadata =
  | InvoiceMetadata
  | ClassMetadata
  | StudentMetadata
  | ComplaintMetadata
  | SuggestionMetadata
  | PaymentMethodMetadata
  | ScheduleMetadata
  | LessonReportMetadata;

/** Alert row shape for the drawer (mirrors SystemAlert selection). */
export interface NotificationDrawerAlert {
  readonly id: string | null;
  readonly deliveryId: string | null;
  readonly type: string | null;
  readonly eventType: NotificationEventType | null;
  readonly channel: NotificationChannel | null;
  readonly metadata: NotificationMetadata | null;
  readonly title: string | null;
  readonly body: string | null;
  readonly createdAt: string | null;
  readonly severity: string | null;
  readonly readAt: string | null;
}

export interface NotificationsDrawerViewModel {
  readonly alerts: readonly NotificationDrawerAlert[];
  readonly unreadCount: number;
  readonly totalCount: number;
  readonly loading: boolean;
  readonly error: Error | undefined;
  readonly drawerOpen: boolean;
  readonly openDrawer: () => void;
  readonly closeDrawer: () => void;
  readonly markOneRead: (deliveryId: string) => Promise<void>;
  readonly markAllRead: () => Promise<void>;
  readonly handleViewEntity: (metadata: NotificationMetadata, eventType?: NotificationEventType | null) => void;
  readonly handleReschedule: (classInstanceId: string) => void;
  readonly handleApproveInvoice: (deliveryId: string, invoiceId: string) => Promise<void>;
  readonly handleRejectInvoice: (deliveryId: string, invoiceId: string) => Promise<void>;
  readonly handleManagePreferences: () => void;
}

export interface NotificationDrawerProps {
  readonly vm: NotificationsDrawerViewModel;
}

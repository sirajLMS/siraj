/**
 * Canonical notification alert metadata types shared by backend and frontend.
 *
 * Backend (`notification-alerts.metadata.types.ts`) and frontend
 * (`notificationDrawer.types.ts`) both import from this single source
 * to eliminate code duplication.
 */

export type NotificationEntityKind =
  | "invoice"
  | "class"
  | "student"
  | "complaint"
  | "suggestion"
  | "paymentMethod"
  | "schedule"
  | "lessonReport";

interface NotificationMetadataBase {
  readonly entityKind: NotificationEntityKind;
  readonly entityId: string;
}

interface InvoiceMetadata extends NotificationMetadataBase {
  readonly entityKind: "invoice";
  readonly amount?: string;
  readonly currency?: string;
  readonly newStatus?: string;
  readonly proofPending?: boolean;
}

interface ClassMetadata extends NotificationMetadataBase {
  readonly entityKind: "class";
  readonly classInstanceId?: string;
  readonly studentName?: string;
  readonly scheduledStartAt?: string;
  readonly newStartAt?: string;
}

interface StudentMetadata extends NotificationMetadataBase {
  readonly entityKind: "student";
  readonly studentName?: string;
  readonly oldStatus?: string;
  readonly newStatus?: string;
}

interface ComplaintMetadata extends NotificationMetadataBase {
  readonly entityKind: "complaint";
}

interface SuggestionMetadata extends NotificationMetadataBase {
  readonly entityKind: "suggestion";
}

interface PaymentMethodMetadata extends NotificationMetadataBase {
  readonly entityKind: "paymentMethod";
}

interface ScheduleMetadata extends NotificationMetadataBase {
  readonly entityKind: "schedule";
}

interface LessonReportMetadata extends NotificationMetadataBase {
  readonly entityKind: "lessonReport";
  readonly classInstanceId?: string;
  readonly decision?: "approved" | "rejected";
}

export type NotificationMetadata =
  | InvoiceMetadata
  | ClassMetadata
  | StudentMetadata
  | ComplaintMetadata
  | SuggestionMetadata
  | PaymentMethodMetadata
  | ScheduleMetadata
  | LessonReportMetadata;

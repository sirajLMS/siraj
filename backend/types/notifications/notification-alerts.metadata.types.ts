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
export type NotificationMetadata =
  | InvoiceMetadata
  | ClassMetadata
  | StudentMetadata
  | ComplaintMetadata
  | SuggestionMetadata
  | PaymentMethodMetadata
  | ScheduleMetadata
  | LessonReportMetadata;

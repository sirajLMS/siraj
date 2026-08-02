import { pgEnum } from "drizzle-orm/pg-core";
import {
  AccountStatus,
  AppLanguage,
  AppPermission,
  AttendanceEvaluation,
  AvailabilityStatus,
  ClassExecutionState,
  ClassOutcome,
  ClassType,
  ComplaintCategory,
  ComplaintStatus,
  CountryCode,
  CreditReason,
  CurrencyCode,
  DayOfWeek,
  DevicePlatform,
  DstMigrationResult,
  FxProvider,
  FxSyncStatus,
  Gender,
  InvoiceStatus,
  InvoiceType,
  LeaveRequesterType,
  LeaveRequestStatus,
  LessonReportStatus,
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationEventType,
  OnDemandNoCreditsOutcome,
  OnDemandStatus,
  ParentStatus,
  QuotaKind,
  QuotaLedgerReason,
  QuotaPeriodType,
  QuotaStatus,
  RateSource,
  SchedulingMode,
  StudentStatus,
  SuggestionStatus,
  SystemSettingCategory,
  SystemSettingDataType,
  TeacherDueStatus,
  VacationRequestStatus,
} from "@/backend/enum";
import { IdentifierKind, PaymentDirection, PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import { createPgEnumFromEnum } from "@/backend/utils/db.utils";

export const quotaKindEnum = createPgEnumFromEnum("quota_kind", QuotaKind);

export const quotaStatusEnum = createPgEnumFromEnum("quota_status", QuotaStatus);

export const quotaPeriodTypeEnum = createPgEnumFromEnum("quota_period_type", QuotaPeriodType);

export const quotaLedgerReasonEnum = createPgEnumFromEnum("quota_ledger_reason", QuotaLedgerReason);

export const schedulingModeEnum = createPgEnumFromEnum("scheduling_mode", SchedulingMode);

export const onDemandNoCreditsOutcomeEnum = createPgEnumFromEnum(
  "ondemand_no_credits_outcome",
  OnDemandNoCreditsOutcome
);

export const onDemandStatusEnum = createPgEnumFromEnum("ondemand_status", OnDemandStatus);

export const appLanguageEnum = createPgEnumFromEnum("app_language", AppLanguage);

export const genderEnum = createPgEnumFromEnum("gender", Gender);

export const countryCodeEnum = createPgEnumFromEnum("country_code", CountryCode);

export const currencyCodeEnum = createPgEnumFromEnum("currency_code", CurrencyCode);

export const accountStatusEnum = createPgEnumFromEnum("account_status", AccountStatus);

export const parentStatusEnum = createPgEnumFromEnum("parent_status", ParentStatus);

export const studentStatusEnum = createPgEnumFromEnum("student_status", StudentStatus);

export const classTypeEnum = createPgEnumFromEnum("class_type", ClassType);

export const classOutcomeEnum = createPgEnumFromEnum("class_outcome", ClassOutcome);

export const classExecutionStateEnum = createPgEnumFromEnum("class_execution_state", ClassExecutionState);

export const invoiceStatusEnum = createPgEnumFromEnum("invoice_status", InvoiceStatus);

export const invoiceTypeEnum = createPgEnumFromEnum("invoice_type", InvoiceType);

export const paymentMethodTypeEnum = createPgEnumFromEnum("payment_method_type", PaymentMethodType);

export const paymentDirectionEnum = createPgEnumFromEnum("payment_direction", PaymentDirection);

export const identifierKindEnum = createPgEnumFromEnum("identifier_kind", IdentifierKind);

export const complaintCategoryEnum = createPgEnumFromEnum("complaint_category", ComplaintCategory);

export const complaintStatusEnum = createPgEnumFromEnum("complaint_status", ComplaintStatus);

export const suggestionStatusEnum = createPgEnumFromEnum("suggestion_status", SuggestionStatus);

export const leaveRequestStatusEnum = createPgEnumFromEnum("leave_request_status", LeaveRequestStatus);

export const leaveRequesterTypeEnum = createPgEnumFromEnum("leave_requester_type", LeaveRequesterType);

export const vacationRequestStatusEnum = createPgEnumFromEnum("vacation_request_status", VacationRequestStatus);

export const notificationChannelEnum = createPgEnumFromEnum("notification_channel", NotificationChannel);

export const notificationEventTypeEnum = createPgEnumFromEnum("notification_event_type", NotificationEventType);

export const notificationDeliveryStatusEnum = createPgEnumFromEnum(
  "notification_delivery_status",
  NotificationDeliveryStatus
);

export const devicePlatformEnum = createPgEnumFromEnum("device_platform", DevicePlatform);

export const dayOfWeekEnum = createPgEnumFromEnum("day_of_week", DayOfWeek);

export const dstMigrationResultEnum = createPgEnumFromEnum("dst_migration_result", DstMigrationResult);

export const availabilityStatusEnum = createPgEnumFromEnum("availability_status", AvailabilityStatus);
export const appPermissionEnum = pgEnum(
  "app_permission",
  Object.values(AppPermission) as [AppPermission, ...AppPermission[]]
);

export const fxProviderEnum = createPgEnumFromEnum("fx_provider", FxProvider);

export const fxSyncStatusEnum = createPgEnumFromEnum("fx_sync_status", FxSyncStatus);

export const systemSettingDataTypeEnum = createPgEnumFromEnum("system_setting_data_type", SystemSettingDataType);

export const systemSettingCategoryEnum = createPgEnumFromEnum("system_setting_category", SystemSettingCategory);

export const teacherDueStatusEnum = createPgEnumFromEnum("teacher_due_status", TeacherDueStatus);

export const lessonReportStatusEnum = createPgEnumFromEnum("lesson_report_status", LessonReportStatus);

export const attendanceEvaluationEnum = createPgEnumFromEnum("attendance_evaluation", AttendanceEvaluation);

export const creditReasonEnum = createPgEnumFromEnum("credit_reason", CreditReason);

export const rateSourceEnum = createPgEnumFromEnum("rate_source", RateSource);

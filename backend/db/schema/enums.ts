import {
  AccountStatus,
  AppLanguage,
  AppPermission,
  AttendanceEvaluation,
  AvailabilityStatus,
  BilledUnit,
  CalculationStatus,
  ComplaintCategory,
  ComplaintStatus,
  CountryCode,
  CreditAdjustmentType,
  CreditReason,
  CronConcurrencyPolicy,
  CronJobKind,
  CronQueueBackend,
  CronRunStatus,
  CronScheduleStatus,
  CronTriggerSource,
  DayOfWeek,
  DevicePlatform,
  DstMigrationResult,
  ExpenseType,
  FxProvider,
  FxSyncStatus,
  Gender,
  InvoiceStatus,
  InvoiceType,
  LeaveRequesterType,
  LeaveRequestStatus,
  LeaveRequestType,
  LessonReportStatus,
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationEventType,
  OnDemandNoCreditsOutcome,
  OnDemandStatus,
  ParentStatus,
  PaymentGateway,
  QuotaKind,
  QuotaLedgerReason,
  QuotaPeriodType,
  QuotaStatus,
  RateSource,
  SchedulingMode,
  StudentStatus,
  SuggestionStatus,
  TeacherDueStatus,
  VacationRequestStatus,
  WhatsappAccountPurpose,
  WhatsappMessageDirection,
  WhatsappOnboardingMode,
  WhatsappSyncRequestStatus,
  WhatsappSyncStatus,
  WhatsappSyncType,
  WhatsappWebhookEventStatus,
} from "@/backend/enum";
import { IdentifierKind, PaymentDirection, PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import { createPgEnumFromEnum } from "@/backend/utils/db.utils";
import { ClassExecutionState, ClassOutcome, ClassType } from "@/shared/constants/class-instance-detail.enum";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { SystemSettingCategory, SystemSettingDataType } from "@/shared/constants/settings/system-settings.enum";

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
export const leaveRequestTypeEnum = createPgEnumFromEnum("leave_request_type", LeaveRequestType);

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
export const appPermissionEnum = createPgEnumFromEnum("app_permission", AppPermission);

export const fxProviderEnum = createPgEnumFromEnum("fx_provider", FxProvider);

export const fxSyncStatusEnum = createPgEnumFromEnum("fx_sync_status", FxSyncStatus);

export const systemSettingDataTypeEnum = createPgEnumFromEnum("system_setting_data_type", SystemSettingDataType);

export const systemSettingCategoryEnum = createPgEnumFromEnum("system_setting_category", SystemSettingCategory);

export const teacherDueStatusEnum = createPgEnumFromEnum("teacher_due_status", TeacherDueStatus);

export const lessonReportStatusEnum = createPgEnumFromEnum("lesson_report_status", LessonReportStatus);

export const attendanceEvaluationEnum = createPgEnumFromEnum("attendance_evaluation", AttendanceEvaluation);

export const creditReasonEnum = createPgEnumFromEnum("credit_reason", CreditReason);

export const creditAdjustmentTypeEnum = createPgEnumFromEnum("credit_adjustment_type", CreditAdjustmentType);

export const rateSourceEnum = createPgEnumFromEnum("rate_source", RateSource);

export const cronScheduleStatusEnum = createPgEnumFromEnum("cron_schedule_status", CronScheduleStatus);

export const cronRunStatusEnum = createPgEnumFromEnum("cron_run_status", CronRunStatus);

export const cronJobKindEnum = createPgEnumFromEnum("cron_job_kind", CronJobKind);

export const cronTriggerSourceEnum = createPgEnumFromEnum("cron_trigger_source", CronTriggerSource);

export const cronConcurrencyPolicyEnum = createPgEnumFromEnum("cron_concurrency_policy", CronConcurrencyPolicy);

export const cronQueueBackendEnum = createPgEnumFromEnum("cron_queue_backend", CronQueueBackend);

export const paymentGatewayEnum = createPgEnumFromEnum("payment_gateway", PaymentGateway);

export const billedUnitEnum = createPgEnumFromEnum("billed_unit", BilledUnit);

export const calculationStatusEnum = createPgEnumFromEnum("calculation_status", CalculationStatus);

export const expenseTypeEnum = createPgEnumFromEnum("expense_type", ExpenseType);

export const whatsappAccountPurposeEnum = createPgEnumFromEnum("whatsapp_account_purpose", WhatsappAccountPurpose);

export const whatsappOnboardingModeEnum = createPgEnumFromEnum("whatsapp_onboarding_mode", WhatsappOnboardingMode);

export const whatsappSyncStatusEnum = createPgEnumFromEnum("whatsapp_sync_status", WhatsappSyncStatus);

export const whatsappMessageDirectionEnum = createPgEnumFromEnum(
  "whatsapp_message_direction",
  WhatsappMessageDirection
);

export const whatsappWebhookEventStatusEnum = createPgEnumFromEnum(
  "whatsapp_webhook_event_status",
  WhatsappWebhookEventStatus
);

export const whatsappSyncRequestStatusEnum = createPgEnumFromEnum(
  "whatsapp_sync_request_status",
  WhatsappSyncRequestStatus
);

export const whatsappSyncTypeEnum = createPgEnumFromEnum("whatsapp_sync_type", WhatsappSyncType);

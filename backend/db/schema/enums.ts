import { pgEnum } from "drizzle-orm/pg-core";
import {
  AccountStatus,
  AppLanguage,
  AppPermission,
  ClassExecutionState,
  ClassOutcome,
  ClassType,
  ComplaintCategory,
  ComplaintStatus,
  CountryCode,
  DayOfWeek,
  DevicePlatform,
  DstMigrationResult,
  Gender,
  InvoiceStatus,
  InvoiceType,
  LeaveRequesterType,
  LeaveRequestStatus,
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationEventType,
  ParentStatus,
  PaymentMethod,
  StudentStatus,
  VacationRequestStatus,
} from "@/shared/lib/enum";
import { createPgEnumFromEnum } from "../../utils/db.utils";

export const appLanguageEnum = createPgEnumFromEnum("app_language", AppLanguage);

export const genderEnum = createPgEnumFromEnum("gender", Gender);

export const countryCodeEnum = createPgEnumFromEnum("country_code", CountryCode);

export const accountStatusEnum = createPgEnumFromEnum("account_status", AccountStatus);

export const parentStatusEnum = createPgEnumFromEnum("parent_status", ParentStatus);

export const studentStatusEnum = createPgEnumFromEnum("student_status", StudentStatus);

export const classTypeEnum = createPgEnumFromEnum("class_type", ClassType);

export const classOutcomeEnum = createPgEnumFromEnum("class_outcome", ClassOutcome);

export const classExecutionStateEnum = createPgEnumFromEnum("class_execution_state", ClassExecutionState);

export const invoiceStatusEnum = createPgEnumFromEnum("invoice_status", InvoiceStatus);

export const invoiceTypeEnum = createPgEnumFromEnum("invoice_type", InvoiceType);

export const paymentMethodEnum = createPgEnumFromEnum("payment_method", PaymentMethod);

export const complaintCategoryEnum = createPgEnumFromEnum("complaint_category", ComplaintCategory);

export const complaintStatusEnum = createPgEnumFromEnum("complaint_status", ComplaintStatus);

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

export const appPermissionEnum = pgEnum(
  "app_permission",
  Object.values(AppPermission) as [AppPermission, ...AppPermission[]]
);

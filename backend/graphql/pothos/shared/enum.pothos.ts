import {
  AccountStatus,
  AppLanguage,
  AppPermission,
  AttendanceEvaluation,
  AttendanceStatus,
  AvailabilitySearchSortBy,
  AvailabilityStatus,
  BookingStatus,
  ClassExecutionState,
  ClassOutcome,
  ClassType,
  CountryCode,
  CreditReason,
  CurrencyCode,
  DayOfWeek,
  FxProvider,
  FxSyncStatus,
  Gender,
  GroupClassAttendanceStatus,
  InvoiceStatus,
  InvoiceType,
  LeaveRequestStatus,
  LessonReportStatus,
  ManagerAccountType,
  NotificationChannel,
  NotificationEventType,
  OrderSortDirection,
  OverrideState,
  ParentStatus,
  ProfileAudience,
  ProfileMode,
  ProfileScope,
  RateSource,
  RescheduleDateLabel,
  StudentStatus,
  SystemSettingCategory,
  SystemSettingDataType,
  TeacherDueStatus,
  UserRole,
} from "@/backend/enum";
import { IdentifierKind, PaymentDirection, PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";

export const AppPermissionPothosEnum = gqlSchemaBuilder.enumType(AppPermission, {
  name: "AppPermission",
});

export const ManagerAccountTypePothosEnum = gqlSchemaBuilder.enumType(ManagerAccountType, {
  name: "ManagerAccountType",
});

export const OrderSortDirectionPothosObject = gqlSchemaBuilder.enumType(OrderSortDirection, {
  name: "OrderSortDirection",
});

export const GenderPothosObject = gqlSchemaBuilder.enumType(Gender, {
  name: "Gender",
});

export const AccountStatusPothosObject = gqlSchemaBuilder.enumType(AccountStatus, {
  name: "AccountStatus",
});

export const CountryCodePothosObject = gqlSchemaBuilder.enumType(CountryCode, {
  name: "CountryCode",
});

export const AppLanguagePothosObject = gqlSchemaBuilder.enumType(AppLanguage, {
  name: "AppLanguage",
});

export const StudentStatusPothosObject = gqlSchemaBuilder.enumType(StudentStatus, {
  name: "StudentStatus",
});

export const ParentStatusPothosEnum = gqlSchemaBuilder.enumType(ParentStatus, {
  name: "ParentStatus",
});

export const InvoiceTypePothosObject = gqlSchemaBuilder.enumType(InvoiceType, {
  name: "InvoiceType",
});

export const PaymentMethodTypePothosEnum = gqlSchemaBuilder.enumType(PaymentMethodType, {
  name: "PaymentMethodType",
});

export const PaymentDirectionPothosEnum = gqlSchemaBuilder.enumType(PaymentDirection, {
  name: "PaymentDirection",
});

export const IdentifierKindPothosEnum = gqlSchemaBuilder.enumType(IdentifierKind, {
  name: "IdentifierKind",
});

export const ClassOutcomePothosObject = gqlSchemaBuilder.enumType(ClassOutcome, {
  name: "ClassOutcome",
});

export const ClassExecutionStatePothosObject = gqlSchemaBuilder.enumType(ClassExecutionState, {
  name: "ClassExecutionState",
});

export const LeaveRequestStatusPothosObject = gqlSchemaBuilder.enumType(LeaveRequestStatus, {
  name: "LeaveRequestStatus",
});

export const RescheduleDateLabelPothosObject = gqlSchemaBuilder.enumType(RescheduleDateLabel, {
  name: "RescheduleDateLabel",
});

export const AvailabilityStatusPothosObject = gqlSchemaBuilder.enumType(AvailabilityStatus, {
  name: "AvailabilityStatus",
});

export const DayOfWeekPothosObject = gqlSchemaBuilder.enumType(DayOfWeek, {
  name: "DayOfWeek",
});

export const InvoiceStatusPothosObject = gqlSchemaBuilder.enumType(InvoiceStatus, {
  name: "InvoiceStatus",
});

export const BookingStatusPothosObject = gqlSchemaBuilder.enumType(BookingStatus, {
  name: "BookingStatus",
});

export const AttendanceStatusPothosObject = gqlSchemaBuilder.enumType(AttendanceStatus, {
  name: "AttendanceStatus",
});

export const GroupClassAttendanceStatusPothosObject = gqlSchemaBuilder.enumType(GroupClassAttendanceStatus, {
  name: "GroupClassAttendanceStatus",
});

export const OverrideStatePothosObject = gqlSchemaBuilder.enumType(OverrideState, {
  name: "OverrideState",
});

export const ClassTypePothosObject = gqlSchemaBuilder.enumType(ClassType, {
  name: "ClassType",
});

export const AvailabilitySearchSortByPothosObject = gqlSchemaBuilder.enumType(AvailabilitySearchSortBy, {
  name: "AvailabilitySearchSortBy",
});

export const NotificationChannelPothosObject = gqlSchemaBuilder.enumType(NotificationChannel, {
  name: "NotificationChannel",
});

export const NotificationEventTypePothosObject = gqlSchemaBuilder.enumType(NotificationEventType, {
  name: "NotificationEventType",
});

export const IanaTimezonePothosObject = gqlSchemaBuilder.enumType(IanaTimezone, {
  name: "IanaTimezone",
});

export const CurrencyCodePothosObject = gqlSchemaBuilder.enumType(CurrencyCode, {
  name: "CurrencyCode",
});

export const FxProviderPothosEnum = gqlSchemaBuilder.enumType(FxProvider, {
  name: "FxProvider",
});

export const FxSyncStatusPothosEnum = gqlSchemaBuilder.enumType(FxSyncStatus, {
  name: "FxSyncStatus",
});

export const ProfileAudiencePothosEnum = gqlSchemaBuilder.enumType(ProfileAudience, {
  name: "ProfileAudience",
});

export const ProfileScopePothosEnum = gqlSchemaBuilder.enumType(ProfileScope, {
  name: "ProfileScope",
});

export const ProfileModePothosEnum = gqlSchemaBuilder.enumType(ProfileMode, {
  name: "ProfileMode",
});

export const UserRolePothosEnum = gqlSchemaBuilder.enumType(UserRole, {
  name: "UserRole",
});

export const CreditReasonPothosEnum = gqlSchemaBuilder.enumType(CreditReason, {
  name: "CreditReason",
});

export const LessonReportStatusPothosEnum = gqlSchemaBuilder.enumType(LessonReportStatus, {
  name: "LessonReportStatus",
});

export const AttendanceEvaluationPothosEnum = gqlSchemaBuilder.enumType(AttendanceEvaluation, {
  name: "AttendanceEvaluation",
});

export const TeacherDueStatusPothosEnum = gqlSchemaBuilder.enumType(TeacherDueStatus, {
  name: "TeacherDueStatus",
});

export const RateSourcePothosEnum = gqlSchemaBuilder.enumType(RateSource, {
  name: "RateSource",
});

export const SystemSettingCategoryPothos = gqlSchemaBuilder.enumType("SystemSettingCategory", {
  values: {
    app: { value: SystemSettingCategory.App },
    auth: { value: SystemSettingCategory.Auth },
    billing: { value: SystemSettingCategory.Billing },
    cache: { value: SystemSettingCategory.Cache },
    communication: { value: SystemSettingCategory.Communication },
    email: { value: SystemSettingCategory.Email },
    fx: { value: SystemSettingCategory.Fx },
    general: { value: SystemSettingCategory.General },
    meeting: { value: SystemSettingCategory.Meeting },
    push: { value: SystemSettingCategory.Push },
    redis: { value: SystemSettingCategory.Redis },
    scheduling: { value: SystemSettingCategory.Scheduling },
    security: { value: SystemSettingCategory.Security },
    sms: { value: SystemSettingCategory.Sms },
    storage: { value: SystemSettingCategory.Storage },
    system: { value: SystemSettingCategory.System },
  },
});

export const SystemSettingDataTypePothos = gqlSchemaBuilder.enumType("SystemSettingDataType", {
  values: {
    boolean: { value: SystemSettingDataType.Boolean },
    integer: { value: SystemSettingDataType.Integer },
    json: { value: SystemSettingDataType.Json },
    string: { value: SystemSettingDataType.String },
  },
});

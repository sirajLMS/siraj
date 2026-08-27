import {
  AccountingPaymentHistoryKind,
  AccountStatus,
  AppLanguage,
  AppPermission,
  AttendanceEvaluation,
  AttendanceStatus,
  AvailabilitySearchSortBy,
  AvailabilityStatus,
  BilledUnit,
  BookingStatus,
  CountryCode,
  CreditReason,
  CronConcurrencyPolicy,
  CronJobKind,
  CronRunStatus,
  CronScheduleStatus,
  CronTriggerSource,
  DayOfWeek,
  EffectiveMeetingSource,
  FxProvider,
  FxProviderConfigSource,
  FxSyncStatus,
  Gender,
  GroupClassAttendanceStatus,
  InvoicePaymentSubmissionStatus,
  InvoiceStatus,
  InvoiceType,
  LeaveRequesterType,
  LeaveRequestStatus,
  LeaveRequestType,
  LessonReportStatus,
  ManagerAccountType,
  MeetingConnectionTestMode,
  MeetingIntegrationConnectedAccountStatus,
  MeetingIntegrationProviderSlug,
  NotificationChannel,
  NotificationEventType,
  OnDemandNoCreditsOutcome,
  OnDemandStatus,
  OrderSortDirection,
  OverrideState,
  ParentStatus,
  PaymentGateway,
  ProfileAudience,
  ProfileMode,
  ProfileScope,
  QuotaKind,
  QuotaLedgerReason,
  QuotaPeriodType,
  QuotaStatus,
  RateSource,
  RescheduleDateLabel,
  SchedulingMode,
  StudentStatus,
  TeacherDueStatus,
  TeacherProgressFeedEventKind,
  UserRole,
  WhatsappLimitTier,
  WhatsappQualityRating,
  WhatsappTemplateCategory,
  WhatsappTemplateStatus,
} from "@/backend/enum";
import { IdentifierKind, PaymentDirection, PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { ClassExecutionState, ClassOutcome, ClassType } from "@/shared/constants/class-instance-detail.enum";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { SystemSettingCategory, SystemSettingDataType } from "@/shared/constants/settings/system-settings.enum";

export const AppPermissionPothosEnum = gqlSchemaBuilder.enumType(AppPermission, {
  name: "AppPermission",
});

export const PaymentGatewayPothosObject = gqlSchemaBuilder.enumType(PaymentGateway, {
  name: "PaymentGateway",
});

export const BilledUnitPothosObject = gqlSchemaBuilder.enumType(BilledUnit, {
  name: "BilledUnit",
});

export const AccountingPaymentHistoryKindPothosObject = gqlSchemaBuilder.enumType(AccountingPaymentHistoryKind, {
  name: "AccountingPaymentHistoryKind",
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
export const LeaveRequesterTypePothosObject = gqlSchemaBuilder.enumType(LeaveRequesterType, {
  name: "LeaveRequesterType",
});
export const LeaveRequestTypePothosObject = gqlSchemaBuilder.enumType(LeaveRequestType, {
  name: "LeaveRequestType",
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

export const SystemSettingCategoryPothos = gqlSchemaBuilder.enumType(SystemSettingCategory, {
  name: "SystemSettingCategory",
});

export const SystemSettingDataTypePothos = gqlSchemaBuilder.enumType(SystemSettingDataType, {
  name: "SystemSettingDataType",
});

export const InvoicePaymentSubmissionStatusPothosEnum = gqlSchemaBuilder.enumType(InvoicePaymentSubmissionStatus, {
  name: "InvoicePaymentSubmissionStatus",
});

export const FxProviderConfigSourcePothosEnum = gqlSchemaBuilder.enumType(FxProviderConfigSource, {
  name: "FxProviderConfigSource",
});

export const TeacherProgressFeedEventKindPothosEnum = gqlSchemaBuilder.enumType(TeacherProgressFeedEventKind, {
  name: "TeacherProgressFeedEventKind",
});

export const CronScheduleStatusPothosEnum = gqlSchemaBuilder.enumType(CronScheduleStatus, {
  name: "CronScheduleStatus",
});

export const CronRunStatusPothosEnum = gqlSchemaBuilder.enumType(CronRunStatus, {
  name: "CronRunStatus",
});

export const CronJobKindPothosEnum = gqlSchemaBuilder.enumType(CronJobKind, {
  name: "CronJobKind",
});

export const CronTriggerSourcePothosEnum = gqlSchemaBuilder.enumType(CronTriggerSource, {
  name: "CronTriggerSource",
});

export const CronConcurrencyPolicyPothosEnum = gqlSchemaBuilder.enumType(CronConcurrencyPolicy, {
  name: "CronConcurrencyPolicy",
});

export const MeetingConnectionTestModePothosEnum = gqlSchemaBuilder.enumType(MeetingConnectionTestMode, {
  name: "MeetingConnectionTestMode",
});

export const MeetingIntegrationConnectedAccountStatusPothosEnum = gqlSchemaBuilder.enumType(
  MeetingIntegrationConnectedAccountStatus,
  { name: "MeetingIntegrationConnectedAccountStatus" }
);

export const MeetingIntegrationProviderSlugPothosEnum = gqlSchemaBuilder.enumType(MeetingIntegrationProviderSlug, {
  name: "MeetingIntegrationProviderSlug",
});

export const WhatsappQualityRatingPothosEnum = gqlSchemaBuilder.enumType(WhatsappQualityRating, {
  name: "WhatsappQualityRating",
});

export const WhatsappLimitTierPothosEnum = gqlSchemaBuilder.enumType(WhatsappLimitTier, {
  name: "WhatsappLimitTier",
});

export const WhatsappTemplateStatusPothosEnum = gqlSchemaBuilder.enumType(WhatsappTemplateStatus, {
  name: "WhatsappTemplateStatus",
});

export const WhatsappTemplateCategoryPothosEnum = gqlSchemaBuilder.enumType(WhatsappTemplateCategory, {
  name: "WhatsappTemplateCategory",
});

export const QuotaKindPothosEnum = gqlSchemaBuilder.enumType(QuotaKind, {
  name: "QuotaKind",
});

export const QuotaStatusPothosEnum = gqlSchemaBuilder.enumType(QuotaStatus, {
  name: "QuotaStatus",
});

export const QuotaPeriodTypePothosEnum = gqlSchemaBuilder.enumType(QuotaPeriodType, {
  name: "QuotaPeriodType",
});

export const QuotaLedgerReasonPothosEnum = gqlSchemaBuilder.enumType(QuotaLedgerReason, {
  name: "QuotaLedgerReason",
});

export const SchedulingModePothosEnum = gqlSchemaBuilder.enumType(SchedulingMode, {
  name: "SchedulingMode",
});

export const OnDemandNoCreditsOutcomePothosEnum = gqlSchemaBuilder.enumType(OnDemandNoCreditsOutcome, {
  name: "OnDemandNoCreditsOutcome",
});

export const OnDemandStatusPothosEnum = gqlSchemaBuilder.enumType(OnDemandStatus, {
  name: "OnDemandStatus",
});

export const EffectiveMeetingSourcePothosEnum = gqlSchemaBuilder.enumType(EffectiveMeetingSource, {
  name: "EffectiveMeetingSource",
});

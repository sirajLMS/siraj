import {
  AccountStatus,
  AppLanguage,
  AppPermission,
  AttendanceStatus,
  AvailabilitySearchSortBy,
  AvailabilityStatus,
  BookingStatus,
  ClassExecutionState,
  ClassOutcome,
  ClassType,
  CountryCode,
  DayOfWeek,
  Gender,
  GroupClassAttendanceStatus,
  InvoiceStatus,
  InvoiceType,
  LeaveRequestStatus,
  NotificationChannel,
  NotificationEventType,
  OrderSortDirection,
  OverrideState,
  ParentStatus,
  PaymentMethod,
  RescheduleDateLabel,
  StudentStatus,
} from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";

export const AppPermissionPothosEnum = gqlSchemaBuilder.enumType(AppPermission, {
  name: "AppPermission",
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

export const PaymentMethodPothosObject = gqlSchemaBuilder.enumType(PaymentMethod, {
  name: "PaymentMethod",
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

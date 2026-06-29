import {
  AccountStatus,
  AppLanguage,
  AvailabilityStatus,
  ClassExecutionState,
  ClassOutcome,
  CountryCode,
  DayOfWeek,
  Gender,
  InvoiceType,
  LeaveRequestStatus,
  OrderSortDirection,
  ParentStatus,
  PaymentMethod,
  RescheduleDateLabel,
  StudentStatus,
} from "@/shared/lib/enum";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

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

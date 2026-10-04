import {
  AccountingPaymentHistoryKind,
  BilledUnit,
  CalculationStatus,
  CreditAdjustmentType,
  CreditReason,
  ExpenseType,
  FxProvider,
  FxProviderConfigSource,
  FxSyncStatus,
  InvoicePaymentSubmissionStatus,
  InvoiceStatus,
  InvoiceType,
  ManagerAccountType,
  OrderSortDirection,
  PaymentGateway,
  RateSource,
} from "@/backend/enum";
import { IdentifierKind, PaymentDirection, PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";

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

export const InvoiceStatusPothosObject = gqlSchemaBuilder.enumType(InvoiceStatus, {
  name: "InvoiceStatus",
});

export const InvoicePaymentSubmissionStatusPothosEnum = gqlSchemaBuilder.enumType(InvoicePaymentSubmissionStatus, {
  name: "InvoicePaymentSubmissionStatus",
});

export const FxProviderConfigSourcePothosEnum = gqlSchemaBuilder.enumType(FxProviderConfigSource, {
  name: "FxProviderConfigSource",
});

export const FxProviderPothosEnum = gqlSchemaBuilder.enumType(FxProvider, {
  name: "FxProvider",
});

export const FxSyncStatusPothosEnum = gqlSchemaBuilder.enumType(FxSyncStatus, {
  name: "FxSyncStatus",
});

export const CreditReasonPothosEnum = gqlSchemaBuilder.enumType(CreditReason, {
  name: "CreditReason",
});

export const CreditAdjustmentTypePothosEnum = gqlSchemaBuilder.enumType(CreditAdjustmentType, {
  name: "CreditAdjustmentType",
});

export const CalculationStatusPothosEnum = gqlSchemaBuilder.enumType(CalculationStatus, {
  name: "CalculationStatus",
});

export const RateSourcePothosEnum = gqlSchemaBuilder.enumType(RateSource, {
  name: "RateSource",
});

export const ExpenseTypePothosEnum = gqlSchemaBuilder.enumType(ExpenseType, {
  name: "ExpenseType",
  description: "Expense ledger category: Salaries | Marketing | Logistics | Technology",
});

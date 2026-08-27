import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { mapQuotaErrorToGraphQLError } from "@/backend/graphql/mutation/billing/quota.mutation";
import {
  accountingPaymentFields,
  packagePlanFields,
} from "@/backend/graphql/pothos/billing/__shared__/accountingFieldHelpers";
import {
  AccountingPaymentHistoryKindPothosObject,
  CurrencyCodePothosObject,
  PaymentGatewayPothosObject,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { AccountingPaymentService } from "@/backend/services";
import type {
  AccountingPaymentBalanceReturnType,
  AccountingPaymentFilter,
  AccountingPaymentHistoryEventReturnType,
  AccountingPaymentReturnType,
  AccountingPaymentSubmitInput,
  AccountingPaymentTogglePaidInput,
  AccountingPaymentUpdateInput,
  PackagePlanSelectType,
  PackagePlanSubmitInput,
  PackagePlanUpdateInput,
} from "@/backend/types";

// ─── OBJECT TYPES (queries/mutations live in query|mutation/billing) ──────────

export const PackagePlanRef = gqlSchemaBuilder.objectRef<PackagePlanSelectType>("PackagePlan");

export const PackagePlanPothosObject = PackagePlanRef.implement({
  description: "A predefined credit-hour package plan in the accounting catalog",
  fields: t => packagePlanFields(t),
});

export const AccountingPaymentRef = gqlSchemaBuilder.objectRef<AccountingPaymentReturnType>("AccountingPayment");

export const AccountingPaymentHistoryEventRef = gqlSchemaBuilder.objectRef<AccountingPaymentHistoryEventReturnType>(
  "AccountingPaymentHistoryEvent"
);

export const AccountingPaymentHistoryEventPothosObject = AccountingPaymentHistoryEventRef.implement({
  description: "A derived timeline event for an accounting payment",
  fields: t => ({
    id: t.exposeString("id"),
    kind: t.field({ type: AccountingPaymentHistoryKindPothosObject, resolve: parent => parent.kind }),
    occurredAt: t.expose("occurredAt", { type: "DateTime" }),
    hoursDelta: t.exposeString("hoursDelta", { nullable: true }),
    notes: t.exposeString("notes", { nullable: true }),
  }),
});

export const AccountingPaymentPothosObject = AccountingPaymentRef.implement({
  description: "An accounting payment that credits credit-hours to a student",
  fields: t => ({
    ...accountingPaymentFields(t),
    transactionId: t.exposeString("transactionId", { nullable: true }),
    history: t.field({
      type: [AccountingPaymentHistoryEventPothosObject],
      description: "Derived timeline events (creation, ledger effects, paid state)",
      resolve: async (parent, _args, ctx) => {
        const actorUserId = await requireAuth(ctx);
        const tErrors = ctx.t().errorsTranslations;
        try {
          return await AccountingPaymentService.getHistory(actorUserId, parent.id, tErrors);
        } catch (error) {
          throw mapQuotaErrorToGraphQLError(error);
        }
      },
    }),
  }),
});

export const AccountingPaymentBalanceRef =
  gqlSchemaBuilder.objectRef<AccountingPaymentBalanceReturnType>("AccountingPaymentBalance");

export const AccountingPaymentBalancePothosObject = AccountingPaymentBalanceRef.implement({
  description: "Credit-hours balance summary for a student",
  fields: t => ({
    id: t.string({ resolve: parent => parent.studentId }),
    studentId: t.exposeString("studentId"),
    creditHoursTotal: t.exposeString("creditHoursTotal"),
    creditHoursRemaining: t.exposeString("creditHoursRemaining"),
  }),
});

// ─── INPUT TYPES ──────────────────────────────────────────────────────────────

export const AccountingPaymentFilterInput = gqlSchemaBuilder
  .inputRef<AccountingPaymentFilter>("AccountingPaymentFilterInput")
  .implement({
    description: "AND-combined filters for the accounting payments list",
    fields: t => ({
      studentId: t.id({ required: false }),
      parentId: t.id({ required: false }),
      fromDate: t.string({ required: false, directives: { constraint: { format: "date" } } }),
      toDate: t.string({ required: false, directives: { constraint: { format: "date" } } }),
      unpaidOnly: t.boolean({ required: false }),
    }),
  });

export const PackagePlanInput = gqlSchemaBuilder.inputRef<PackagePlanSubmitInput>("PackagePlanInput").implement({
  description: "Input for creating a package plan",
  fields: t => ({
    codename: t.string({ required: true, directives: { constraint: { maxLength: 50 } } }),
    displayName: t.string({ required: true, directives: { constraint: { maxLength: 255 } } }),
    description: t.string({ required: false }),
    creditHours: t.float({
      required: true,
      directives: { constraint: { min: 0.01, max: 100000 } },
    }),
    priceAmount: t.float({
      required: true,
      directives: { constraint: { min: 0.01, max: 99999999 } },
    }),
    currency: t.field({ type: CurrencyCodePothosObject, required: true }),
    validityMonths: t.int({ required: false }),
    active: t.boolean({ required: false }),
    sortOrder: t.int({ required: false }),
  }),
});

export const PackagePlanUpdateInputType = gqlSchemaBuilder
  .inputRef<PackagePlanUpdateInput>("PackagePlanUpdateInput")
  .implement({
    description: "Input for updating a package plan (optimistic-lock aware)",
    fields: t => ({
      id: t.id({ required: true }),
      displayName: t.string({ required: false }),
      description: t.string({ required: false }),
      creditHours: t.float({ required: false }),
      priceAmount: t.float({ required: false }),
      currency: t.field({ type: CurrencyCodePothosObject, required: false }),
      validityMonths: t.int({ required: false }),
      active: t.boolean({ required: false }),
      sortOrder: t.int({ required: false }),
      version: t.int({ required: false }),
    }),
  });

export const AccountingPaymentInput = gqlSchemaBuilder
  .inputRef<AccountingPaymentSubmitInput>("AccountingPaymentInput")
  .implement({
    description: "Input for recording an accounting payment (hour purchase)",
    fields: t => ({
      studentId: t.id({ required: true }),
      packagePlanId: t.id({ required: false }),
      creditHours: t.float({
        required: true,
        directives: { constraint: { min: 0.01, max: 100000 } },
      }),
      amount: t.float({
        required: true,
        directives: { constraint: { min: 0.01, max: 99999999 } },
      }),
      currency: t.field({ type: CurrencyCodePothosObject, required: true }),
      paymentGateway: t.field({ type: PaymentGatewayPothosObject, required: true }),
      paymentDate: t.field({ type: "DateTime", required: true }),
      isPaidStatusOn: t.boolean({ required: false }),
      paymentNote: t.string({ required: false }),
    }),
  });

export const AccountingPaymentUpdateInputObject = gqlSchemaBuilder
  .inputRef<AccountingPaymentUpdateInput>("AccountingPaymentEditInput")
  .implement({
    description: "Input for editing an accounting payment",
    fields: t => ({
      id: t.id({ required: true }),
      paymentGateway: t.field({ type: PaymentGatewayPothosObject, required: false }),
      paymentNote: t.string({ required: false }),
      creditHours: t.float({ required: false }),
      expectedInvoiceVersion: t.int({ required: false }),
    }),
  });

export const AccountingPaymentTogglePaidInputObject = gqlSchemaBuilder
  .inputRef<AccountingPaymentTogglePaidInput>("AccountingPaymentTogglePaidInput")
  .implement({
    description: "Input for toggling the paid status of an accounting payment",
    fields: t => ({
      id: t.id({ required: true }),
      isPaidStatusOn: t.boolean({ required: true }),
      expectedInvoiceVersion: t.int({ required: false }),
    }),
  });

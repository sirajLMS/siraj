import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { UserPaymentMethodInitialInputPothos } from "@/backend/graphql/pothos/billing/payment-method.pothos";
import { CurrencyCodePothosObject, InvoiceTypePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import { safeParseCurrencyCode } from "@/backend/lib/currency.validation";
import type { ParentOnboardingGqlInput, ParentOnboardingResult } from "@/backend/types";

export const ParentOnboardingInputPothosObject = gqlSchemaBuilder
  .inputRef<ParentOnboardingGqlInput>("ParentOnboardingInput")
  .implement({
    description: "Input for creating a new parent account with billing configuration",
    fields: t => ({
      name: t.string({ required: true, directives: { constraint: { maxLength: 512 } } }),
      email: t.field({ type: "Email", required: true }),
      password: t.string({ required: true, directives: { constraint: { maxLength: 128 } } }),
      avatarUrl: t.string({ required: false, directives: { constraint: { maxLength: 1024 } } }),
      phone: t.string({ directives: { constraint: { maxLength: 512 } } }),
      nationality: t.string({ directives: { constraint: { maxLength: 512 } } }),
      address: t.string({ directives: { constraint: { maxLength: 2000 } } }),
      facebook: t.string({ directives: { constraint: { maxLength: 512 } } }),
      whatsapp: t.string({ directives: { constraint: { maxLength: 512 } } }),
      twitter: t.string({ directives: { constraint: { maxLength: 512 } } }),
      invoiceType: t.field({ type: InvoiceTypePothosObject }),
      feeAmount: t.string({ directives: { constraint: { maxLength: 512 } } }),
      initialPayinMethod: t.field({ type: UserPaymentMethodInitialInputPothos, required: false }),
      currency: t.field({ type: CurrencyCodePothosObject }),
      timezone: t.field({ type: "IanaTimezone", required: true }),
      displayCurrency: t.field({ type: CurrencyCodePothosObject, required: false }),
    }),
  });

export const ParentOnboardingResultPothosObject = gqlSchemaBuilder
  .objectRef<ParentOnboardingResult>("ParentOnboardingResult")
  .implement({
    description: "Result of parent onboarding operation",
    fields: t => ({
      id: t.string({ resolve: parent => parent.parentId }),
      userId: t.exposeString("userId"),
      parentId: t.exposeString("parentId"),
      name: t.exposeString("name"),
      email: t.exposeString("email"),
      status: t.exposeString("status"),
      invoiceType: t.exposeString("invoiceType", { nullable: true }),
      currency: t.field({
        type: CurrencyCodePothosObject,
        nullable: true,
        resolve: parent => safeParseCurrencyCode(parent.currency),
      }),
    }),
  });

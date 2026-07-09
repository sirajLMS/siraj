import type { InvoiceType, PaymentMethod } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { InvoiceTypePothosObject, PaymentMethodPothosObject } from "@/backend/graphql/pothos/enum.pothos";
import type { Email } from "@/backend/lib/email";
import type {
  ParentOnboardingInput,
  ParentOnboardingResult,
} from "@/backend/services/parent/parent-onboarding.service";

export interface ParentOnboardingGqlInput
  extends Omit<ParentOnboardingInput, "email" | "invoiceType" | "paymentMethod"> {
  email: Email;
  invoiceType?: InvoiceType | null;
  paymentMethod?: PaymentMethod | null;
}

export const ParentOnboardingInputPothosObject = gqlSchemaBuilder
  .inputRef<ParentOnboardingGqlInput>("ParentOnboardingInput")
  .implement({
    description: "Input for creating a new parent account with billing configuration",
    fields: t => ({
      name: t.string({ required: true, directives: { constraint: { maxLength: 512 } } }),
      email: t.field({ type: "Email", required: true }),
      password: t.string({ required: true, directives: { constraint: { maxLength: 128 } } }),
      phone: t.string({ directives: { constraint: { maxLength: 512 } } }),
      nationality: t.string({ directives: { constraint: { maxLength: 512 } } }),
      address: t.string({ directives: { constraint: { maxLength: 2000 } } }),
      facebook: t.string({ directives: { constraint: { maxLength: 512 } } }),
      whatsapp: t.string({ directives: { constraint: { maxLength: 512 } } }),
      twitter: t.string({ directives: { constraint: { maxLength: 512 } } }),
      defaultZoomLink: t.string({ directives: { constraint: { maxLength: 2000 } } }),
      invoiceType: t.field({ type: InvoiceTypePothosObject }),
      feeAmount: t.string({ directives: { constraint: { maxLength: 512 } } }),
      paymentMethod: t.field({ type: PaymentMethodPothosObject }),
      currency: t.string({ directives: { constraint: { maxLength: 512 } } }),
      timezone: t.string({ directives: { constraint: { maxLength: 512 } } }),
    }),
  });

export const ParentOnboardingResultPothosObject = gqlSchemaBuilder
  .objectRef<ParentOnboardingResult>("ParentOnboardingResult")
  .implement({
    description: "Result of parent onboarding operation",
    fields: t => ({
      userId: t.exposeString("userId"),
      parentId: t.exposeString("parentId"),
      name: t.exposeString("name"),
      email: t.exposeString("email"),
      status: t.exposeString("status"),
      invoiceType: t.exposeString("invoiceType", { nullable: true }),
      currency: t.exposeString("currency", { nullable: true }),
    }),
  });

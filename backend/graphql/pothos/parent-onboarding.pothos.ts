import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import type { Email } from "@/backend/lib/email";
import type {
  ParentOnboardingInput,
  ParentOnboardingResult,
} from "@/backend/services/parent/parent-onboarding.service";
import type { InvoiceType, PaymentMethod } from "@/shared/lib/enum";
import { InvoiceTypePothosObject, PaymentMethodPothosObject } from "./enum.pothos";

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
      name: t.string({ required: true }),
      email: t.field({ type: "Email", required: true }),
      password: t.string({ required: true }),
      phone: t.string(),
      nationality: t.string(),
      address: t.string(),
      facebook: t.string(),
      whatsapp: t.string(),
      twitter: t.string(),
      skype: t.string(),
      defaultZoomLink: t.string(),
      invoiceType: t.field({ type: InvoiceTypePothosObject }),
      feeAmount: t.string(),
      paymentMethod: t.field({ type: PaymentMethodPothosObject }),
      currency: t.string(),
      timezone: t.string(),
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

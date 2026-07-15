import { z } from "zod";
import { PaymentDirection, PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";

const detailsSchema = z.object({
  walletId: z.string().optional(),
  phone: z.string().optional(),
  paymentLinkId: z.string().optional(),
  url: z.string().optional(),
  onlineAccountId: z.string().optional(),
  identifier: z.string().optional(),
  iban: z.string().optional(),
  bankName: z.string().optional(),
  beneficiaryName: z.string().optional(),
  swiftBic: z.string().optional(),
  accountNumber: z.string().optional(),
  routingNumber: z.string().optional(),
  note: z.string().optional(),
});

const paymentMethodBaseSchema = z.object({
  type: z.enum(PaymentMethodType),
  direction: z.enum(PaymentDirection),
  label: z.string().optional(),
  isDefault: z.boolean(),
  details: detailsSchema,
});

function addRequiredIssue(ctx: z.RefinementCtx, path: string): void {
  ctx.addIssue({ code: z.ZodIssueCode.custom, message: "required", path: [path] });
}

type PaymentMethodDetailsValues = z.infer<typeof detailsSchema>;

function validateMobileWallet(details: PaymentMethodDetailsValues, ctx: z.RefinementCtx): void {
  if (!details.walletId?.trim()) {
    addRequiredIssue(ctx, "details.walletId");
  }
  if (!details.phone?.trim()) {
    addRequiredIssue(ctx, "details.phone");
  }
}

function validatePaymentLink(details: PaymentMethodDetailsValues, ctx: z.RefinementCtx): void {
  if (!details.paymentLinkId?.trim()) {
    addRequiredIssue(ctx, "details.paymentLinkId");
  }
  if (!details.url?.trim()) {
    addRequiredIssue(ctx, "details.url");
  }
}

function validateOnlineAccount(details: PaymentMethodDetailsValues, ctx: z.RefinementCtx): void {
  if (!details.onlineAccountId?.trim()) {
    addRequiredIssue(ctx, "details.onlineAccountId");
  }
  if (!details.identifier?.trim()) {
    addRequiredIssue(ctx, "details.identifier");
  }
}

function validateBankTransfer(details: PaymentMethodDetailsValues, ctx: z.RefinementCtx): void {
  const hasRouting =
    Boolean(details.iban?.trim()) ||
    Boolean(details.accountNumber?.trim()) ||
    Boolean(details.bankName?.trim()) ||
    Boolean(details.beneficiaryName?.trim());
  if (!hasRouting) {
    addRequiredIssue(ctx, "details.iban");
  }
}

const paymentMethodRefinement = (
  value: Pick<z.infer<typeof paymentMethodBaseSchema>, "type" | "details">,
  ctx: z.RefinementCtx
) => {
  const { type, details } = value;

  switch (type) {
    case PaymentMethodType.MobileWallet:
      validateMobileWallet(details, ctx);
      break;
    case PaymentMethodType.PaymentLink:
      validatePaymentLink(details, ctx);
      break;
    case PaymentMethodType.OnlineAccount:
      validateOnlineAccount(details, ctx);
      break;
    case PaymentMethodType.BankTransfer:
      validateBankTransfer(details, ctx);
      break;
  }
};

export const paymentMethodFormSchema = paymentMethodBaseSchema.superRefine(paymentMethodRefinement);

export type PaymentMethodFormValues = z.infer<typeof paymentMethodFormSchema>;

export const onboardingPaymentMethodSchema = paymentMethodBaseSchema
  .omit({ direction: true, isDefault: true })
  .superRefine(paymentMethodRefinement);

export type OnboardingPaymentMethodFormValues = z.infer<typeof onboardingPaymentMethodSchema>;

export function createEmptyPaymentMethodFormValues(
  direction: PaymentDirection,
  type: PaymentMethodType = PaymentMethodType.BankTransfer
): PaymentMethodFormValues {
  return {
    type,
    direction,
    label: "",
    isDefault: false,
    details: {},
  };
}

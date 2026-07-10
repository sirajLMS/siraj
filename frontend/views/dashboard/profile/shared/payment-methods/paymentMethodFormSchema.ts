import { z } from "zod";
import { PaymentDirection, PaymentMethodType } from "@/frontend/graphql/generated/gql/graphql-types";

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

export const paymentMethodFormSchema = z
  .object({
    type: z.nativeEnum(PaymentMethodType),
    direction: z.nativeEnum(PaymentDirection),
    label: z.string().optional(),
    isDefault: z.boolean(),
    details: detailsSchema,
  })
  .superRefine((value, ctx) => {
    const { type, details } = value;

    if (type === PaymentMethodType.MobileWallet) {
      if (!details.walletId?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "required", path: ["details", "walletId"] });
      }
      if (!details.phone?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "required", path: ["details", "phone"] });
      }
    }

    if (type === PaymentMethodType.PaymentLink) {
      if (!details.paymentLinkId?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "required", path: ["details", "paymentLinkId"] });
      }
      if (!details.url?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "required", path: ["details", "url"] });
      }
    }

    if (type === PaymentMethodType.OnlineAccount) {
      if (!details.onlineAccountId?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "required", path: ["details", "onlineAccountId"] });
      }
      if (!details.identifier?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "required", path: ["details", "identifier"] });
      }
    }

    if (type === PaymentMethodType.BankTransfer) {
      const hasRouting =
        Boolean(details.iban?.trim()) ||
        Boolean(details.accountNumber?.trim()) ||
        Boolean(details.bankName?.trim()) ||
        Boolean(details.beneficiaryName?.trim());
      if (!hasRouting) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "required", path: ["details", "iban"] });
      }
    }
  });

export type PaymentMethodFormValues = z.infer<typeof paymentMethodFormSchema>;

export const onboardingPaymentMethodSchema = paymentMethodFormSchema.omit({ direction: true, isDefault: true });

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

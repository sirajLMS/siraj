import { z } from "zod";
import { PaymentDirection, PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import type {
  BankTransferDetails,
  CashDetails,
  MobileWalletDetails,
  OnlineAccountDetails,
  PaymentLinkDetails,
  PaymentMethodDetails,
  UserPaymentMethodSubmitInput,
} from "@/backend/types";
import { DEFAULT_CONTENT_LOCALE, isAppLocale, type LocalizedString } from "@/shared/types/localized-string";

// ============================================================================
// Enum schemas (runtime mirrors of `@/backend/enum/billing/payment-method.enum`)
// ============================================================================
const paymentMethodTypeEnumSchema = z.enum(PaymentMethodType);
const paymentDirectionEnumSchema = z.enum(PaymentDirection);

// ============================================================================
// LocalizedString schema
// ============================================================================
// `LocalizedString` in this repo is `Partial<Record<AppLocale, string>>` —
// empty maps are valid (an optional column may be `{}`); when a column is
// `.notNull()` the catalog layer requires at least one locale entry, enforced
// via `localizedStringRequiredSchema`. The keys must be known `AppLocale`
// values (rejects typos like `"arz"` early) and values are non-empty strings.

export const localizedStringSchema = z
  .record(z.string(), z.string())
  .check(ctx => {
    const map = ctx.value;
    for (const key of Object.keys(map)) {
      if (!isAppLocale(key)) {
        ctx.issues.push({
          code: "custom",
          message: `Unknown locale key: ${key}`,
          path: [key],
          input: ctx.value,
        });
      }
    }
  })
  .transform(map => map as LocalizedString);

/** Required-variant: at least one non-empty entry, and `requiredLocales` (default `[DEFAULT_CONTENT_LOCALE]`) must be present. */
export const localizedStringRequiredSchema = (requiredLocales: readonly string[] = [DEFAULT_CONTENT_LOCALE]) =>
  z
    .record(z.string(), z.string())
    .check(ctx => {
      const map = ctx.value;
      const entries = Object.entries(map);
      const hasAny = entries.some(([, v]) => typeof v === "string" && v.trim() !== "");
      if (!hasAny) {
        ctx.issues.push({
          code: "custom",
          message: "atLeastOneTranslationRequired",
          input: ctx.value,
        });
        return;
      }
      for (const key of Object.keys(map)) {
        if (!isAppLocale(key)) {
          ctx.issues.push({
            code: "custom",
            message: `Unknown locale key: ${key}`,
            path: [key],
            input: ctx.value,
          });
        }
      }
      for (const locale of requiredLocales) {
        const v = map[locale];
        if (!(typeof v === "string" && v.trim() !== "")) {
          ctx.issues.push({
            code: "custom",
            message: `localeRequired:${locale}`,
            path: [locale],
            input: ctx.value,
          });
        }
      }
    })
    .transform(map => map as LocalizedString);

// ============================================================================
// Per-type details schemas (spec § Validation rules, lines 227-234)
// ============================================================================

const mobileWalletDetailsSchema = z.object({
  walletId: z.guid(),
  phone: z.string().min(1), // E.164 validated at service layer against catalog phoneRegion
}) satisfies z.ZodType<MobileWalletDetails>;

const paymentLinkDetailsSchema = z.object({
  paymentLinkId: z.guid(),
  url: z.url(),
}) satisfies z.ZodType<PaymentLinkDetails>;

const onlineAccountDetailsSchema = z.object({
  onlineAccountId: z.guid(),
  identifier: z.string().min(1),
}) satisfies z.ZodType<OnlineAccountDetails>;

// At least one routing field; sensitive fields encrypted by service before persist
export const bankTransferDetailsSchema = z
  .object({
    iban: z.string().optional(),
    bankName: z.string().optional(),
    beneficiaryName: z.string().optional(),
    swiftBic: z.string().optional(),
    accountNumber: z.string().optional(),
    routingNumber: z.string().optional(),
  })
  .check(ctx => {
    const data = ctx.value;
    if (!(data.iban || data.accountNumber || data.routingNumber || data.swiftBic)) {
      ctx.issues.push({
        code: "custom",
        message: "At least one bank routing field is required",
        input: ctx.value,
      });
    }
  }) satisfies z.ZodType<BankTransferDetails>;

const cashDetailsSchema = z.object({
  note: z.string().optional(),
}) satisfies z.ZodType<CashDetails>;

// ============================================================================
// parsePaymentMethodDetails — runtime gate (spec line 211)
// ============================================================================
// Always validate `{ type, details }` together, never `details` alone. The row
// carries the `type` discriminator; this switch dispatches the right per-type
// schema. Throws ZodError on failure.

export function parsePaymentMethodDetails(type: PaymentMethodType, details: unknown): PaymentMethodDetails {
  switch (type) {
    case PaymentMethodType.MOBILE_WALLET:
      return mobileWalletDetailsSchema.parse(details);
    case PaymentMethodType.PAYMENT_LINK:
      return paymentLinkDetailsSchema.parse(details);
    case PaymentMethodType.ONLINE_ACCOUNT:
      return onlineAccountDetailsSchema.parse(details);
    case PaymentMethodType.BANK_TRANSFER:
      return bankTransferDetailsSchema.parse(details);
    case PaymentMethodType.CASH:
      return cashDetailsSchema.parse(details);
    case PaymentMethodType.PROOF_UPLOAD:
      throw new Error("Proof upload is not a configurable payment method type");
    default: {
      const exhaustive: never = type;
      throw new Error(`Unknown payment method type: ${String(exhaustive)}`);
    }
  }
}

// ============================================================================
// UserPaymentMethodSubmitInput — service boundary gate
// ============================================================================
// Mirrors `UserPaymentMethodSubmitInput` from the types file. Validates
// `{ type, details }` together via `parsePaymentMethodDetails`. The catalog
// checks (active wallet, URL allowlist, identifier kind) happen at the service
// layer against the catalog row; this schema enforces structural shape only.

export const userPaymentMethodSubmitInputSchema = z
  .object({
    userId: z.guid(),
    type: paymentMethodTypeEnumSchema,
    direction: paymentDirectionEnumSchema,
    isDefault: z.boolean(),
    label: z.string().max(100).nullable().optional(),
    details: z.unknown(),
  })
  .check(ctx => {
    const data = ctx.value;
    try {
      parsePaymentMethodDetails(data.type, data.details);
    } catch {
      ctx.issues.push({
        code: "custom",
        message: "details do not match the declared type",
        path: ["details"],
        input: ctx.value,
      });
    }
  }) satisfies z.ZodType<Omit<UserPaymentMethodSubmitInput, "details"> & { details: unknown }>;

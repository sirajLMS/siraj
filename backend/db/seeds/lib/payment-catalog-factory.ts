import { CountryCode, IdentifierKind, PaymentDirection } from "@/backend/enum";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import type { LocalizedString } from "@/shared/types";

export type MobileWalletCatalogSeed = {
  slug: string;
  name: LocalizedString;
  description: LocalizedString;
  instructions: LocalizedString;
  countryCode: CountryCode;
  currencyCode: CurrencyCode;
  phoneRegion: string;
  supportedDirections: PaymentDirection;
};

export type PaymentLinkCatalogSeed = {
  slug: string;
  name: LocalizedString;
  description: LocalizedString;
  instructions: LocalizedString;
  urlAllowlist: readonly string[];
  urlExample: string;
  supportedDirections: PaymentDirection;
};

export type OnlineAccountCatalogSeed = {
  slug: string;
  name: LocalizedString;
  description: LocalizedString;
  instructions: LocalizedString;
  identifierKind: IdentifierKind;
  identifierLabel: LocalizedString;
  supportedDirections: PaymentDirection;
};

export const MOBILE_WALLET_CATALOG_SEEDS: readonly MobileWalletCatalogSeed[] = [
  {
    slug: "vodafone_cash_eg",
    name: { en: "Vodafone Cash", ar: "فودافون كاش" },
    description: {
      en: "Vodafone Cash mobile wallet for Egypt",
      ar: "محفظة فودافون كاش للدفع عبر الهاتف في مصر",
    },
    instructions: {
      en: "Enter the Vodafone Cash phone number registered to your wallet.",
      ar: "أدخل رقم هاتف فودافون كاش المسجل في محفظتك.",
    },
    countryCode: CountryCode.EG,
    currencyCode: CurrencyCode.EGP,
    phoneRegion: "EG",
    supportedDirections: PaymentDirection.BOTH,
  },
  {
    slug: "etisalat_cash_eg",
    name: { en: "Etisalat Cash", ar: "اتصالات كاش" },
    description: {
      en: "Etisalat Cash mobile wallet for Egypt",
      ar: "محفظة اتصالات كاش للدفع عبر الهاتف في مصر",
    },
    instructions: {
      en: "Enter the Etisalat Cash phone number registered to your wallet.",
      ar: "أدخل رقم هاتف اتصالات كاش المسجل في محفظتك.",
    },
    countryCode: CountryCode.EG,
    currencyCode: CurrencyCode.EGP,
    phoneRegion: "EG",
    supportedDirections: PaymentDirection.BOTH,
  },
  {
    slug: "stc_pay_sa",
    name: { en: "STC Pay", ar: "STC Pay" },
    description: {
      en: "STC Pay mobile wallet for Saudi Arabia",
      ar: "محفظة STC Pay للدفع عبر الهاتف في السعودية",
    },
    instructions: {
      en: "Enter the STC Pay phone number registered to your wallet.",
      ar: "أدخل رقم هاتف STC Pay المسجل في محفظتك.",
    },
    countryCode: CountryCode.SA,
    currencyCode: CurrencyCode.SAR,
    phoneRegion: "SA",
    supportedDirections: PaymentDirection.BOTH,
  },
] as const;

export const PAYMENT_LINK_CATALOG_SEEDS: readonly PaymentLinkCatalogSeed[] = [
  {
    slug: "instapay_eg",
    name: { en: "InstaPay", ar: "إنستا باي" },
    description: {
      en: "InstaPay payment link rail for Egypt",
      ar: "رابط دفع إنستا باي في مصر",
    },
    instructions: {
      en: "Paste your InstaPay payment link (must be from instapay.com.eg).",
      ar: "الصق رابط الدفع الخاص بك من إنستا باي (يجب أن يكون من instapay.com.eg).",
    },
    urlAllowlist: ["instapay.com.eg"],
    urlExample: "https://ipn.instapay.com.eg/...",
    supportedDirections: PaymentDirection.PAYIN,
  },
] as const;

export const ONLINE_ACCOUNT_CATALOG_SEEDS: readonly OnlineAccountCatalogSeed[] = [
  {
    slug: "paypal",
    name: { en: "PayPal", ar: "باي بال" },
    description: {
      en: "PayPal online account for global pay-in and pay-out",
      ar: "حساب باي بال للدفع والتحويل عالمياً",
    },
    instructions: {
      en: "Enter the PayPal email or handle linked to your account.",
      ar: "أدخل البريد الإلكتروني أو المعرف المرتبط بحساب باي بال.",
    },
    identifierKind: IdentifierKind.EMAIL_OR_HANDLE,
    identifierLabel: { en: "PayPal email or handle", ar: "بريد أو معرف باي بال" },
    supportedDirections: PaymentDirection.BOTH,
  },
  {
    slug: "wise",
    name: { en: "Wise", ar: "وايز" },
    description: {
      en: "Wise online account for international transfers",
      ar: "حساب وايز للتحويلات الدولية",
    },
    instructions: {
      en: "Enter your Wise email or @tag.",
      ar: "أدخل بريد وايز الإلكتروني أو المعرف @tag.",
    },
    identifierKind: IdentifierKind.EMAIL_OR_HANDLE,
    identifierLabel: { en: "Wise email or tag", ar: "بريد أو معرف وايز" },
    supportedDirections: PaymentDirection.BOTH,
  },
] as const;

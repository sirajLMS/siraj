// NEW FOR PLAN v5 (lifted from frontend/mobile/components/ui/input/paymentMethodTypeFields/paymentMethodTypeFields.types.ts)
// Canonical home for paymentMethodTypeFields UI-primitive types per the one-per-contract rule (specs.md §4).
// BOTH mobile and desktop tier files import from this single location.

import type { Control, FieldValues } from "react-hook-form";
import type { CurrencyCode, PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql";
import type { CurrencyOption } from "@/frontend/common/lib/currency";
import type { CountryType } from "@/frontend/common/lib/locale";
import type { PaymentMethodCatalogOption } from "@/frontend/common/lib/payment-method";
import type { PaymentMethodTypeSelectorLabels } from "@/shared/locale/types/ui";

export type PaymentMethodDetailsFormValue = {
  readonly walletId?: string;
  readonly phone?: string;
  readonly paymentLinkId?: string;
  readonly url?: string;
  readonly onlineAccountId?: string;
  readonly identifier?: string;
  readonly iban?: string;
  readonly bankName?: string;
  readonly beneficiaryName?: string;
  readonly swiftBic?: string;
  readonly accountNumber?: string;
  readonly routingNumber?: string;
  readonly note?: string;
};

export type PaymentMethodCatalogFormValue = {
  readonly name?: Record<string, string>;
  readonly description?: Record<string, string>;
  readonly instructions?: Record<string, string>;
  readonly countryCode?: CountryType | null;
  readonly currency?: CurrencyOption | null;
  readonly urlAllowlist?: readonly string[];
};

export type PaymentMethodTypeFieldsProps<T extends FieldValues> = {
  readonly type: PaymentMethodType;
  readonly control: Control<T>;
  readonly disabled?: boolean;
  readonly walletOptions?: readonly PaymentMethodCatalogOption[];
  readonly paymentLinkOptions?: readonly PaymentMethodCatalogOption[];
  readonly onlineAccountOptions?: readonly PaymentMethodCatalogOption[];
  readonly selectedWallet?: PaymentMethodCatalogOption | null;
  readonly selectedPaymentLink?: PaymentMethodCatalogOption | null;
  readonly selectedOnlineAccount?: PaymentMethodCatalogOption | null;
  readonly onWalletChangeAction?: (option: PaymentMethodCatalogOption) => void;
  readonly onPaymentLinkChangeAction?: (option: PaymentMethodCatalogOption) => void;
  readonly onOnlineAccountChangeAction?: (option: PaymentMethodCatalogOption) => void;
  readonly allowedCurrencyCodes?: readonly CurrencyCode[];
  readonly showCatalogMetadata?: boolean;
  readonly detailsPrefix?: string;
  readonly catalogPrefix?: string;
};

export type PaymentMethodTypeSelectorProps = {
  readonly type: PaymentMethodType | null;
  readonly setTypeAction: (type: PaymentMethodType | null) => void;
  readonly error?: boolean;
  readonly required?: boolean;
  readonly fullWidth?: boolean;
  readonly labels?: Partial<PaymentMethodTypeSelectorLabels>;
  readonly allowEmpty?: boolean;
  readonly allowedTypes?: readonly PaymentMethodType[];
};

// Re-exported from @/shared/locale so consumers have a single import site for type aliases.
export type { PaymentMethodTypeSelectorLabels } from "@/shared/locale/types/ui";

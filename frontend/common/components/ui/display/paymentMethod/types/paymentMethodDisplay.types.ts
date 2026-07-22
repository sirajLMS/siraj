// NEW FOR PLAN v5 (lifted from frontend/{mobile,desktop}/components/ui/display/paymentMethod/paymentMethodDisplay.types.ts)
import type {
  CurrencyCode,
  PaymentDirection,
  PaymentMethodType,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { LocalizedString } from "@/shared/types";

export type PaymentMethodDisplayData = {
  readonly id?: string;
  readonly type?: PaymentMethodType | null;
  readonly direction?: PaymentDirection | null;
  readonly label?: string | null;
  readonly catalogName?: LocalizedString | null;
  readonly catalogSlug?: string | null;
  readonly logoUrl?: string | null;
  readonly details?: {
    readonly phone?: string | null;
    readonly url?: string | null;
    readonly identifier?: string | null;
    readonly iban?: string | null;
    readonly bankName?: string | null;
    readonly beneficiaryName?: string | null;
    readonly note?: string | null;
  } | null;
  readonly countryCode?: string | null;
  readonly currencyCode?: CurrencyCode | string | null;
  readonly verifiedAt?: string | null;
  readonly isActive?: boolean | null;
  readonly isDefault?: boolean;
  readonly masked?: boolean;
};

export type PaymentMethodRow = PaymentMethodDisplayData & {
  readonly id: string;
  readonly type: PaymentMethodType;
  readonly direction: PaymentDirection;
  readonly isDefault: boolean;
};

export type PaymentMethodDisplayProps = {
  readonly method: PaymentMethodDisplayData;
  readonly showStatus?: boolean;
  readonly showDirection?: boolean;
  readonly compact?: boolean;
};

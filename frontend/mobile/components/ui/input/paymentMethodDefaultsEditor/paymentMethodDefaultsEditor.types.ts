import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { CurrencyOption } from "@/frontend/common/lib/currency";
import type { LocalizedString } from "@/frontend/common/types/localized-string.types";

export type PaymentMethodRow = {
  readonly id: string;
  readonly label: string | null;
  readonly catalogSlug: string;
  readonly type: string | null;
  readonly direction: string | null;
  readonly isDefault: boolean;
  readonly emoji: string | null;
};

export type PaymentMethodDefaultsEditorProps = {
  readonly methods: readonly PaymentMethodRow[];
  readonly payinDefaultId: string | null;
  readonly payoutDefaultId: string | null;
  readonly onPayinDefaultChangeAction: (id: string | null) => void;
  readonly onPayoutDefaultChangeAction: (id: string | null) => void;
  readonly instructions?: LocalizedString;
  readonly onInstructionsSaveAction?: (value: LocalizedString) => void;
  readonly displayCurrency?: CurrencyOption | null;
  readonly onDisplayCurrencyChangeAction?: (currency: CurrencyOption) => void;
  readonly allowedCurrencyCodes?: readonly CurrencyCode[];
  readonly disabled?: boolean;
  readonly successOpen?: boolean;
  readonly onSuccessCloseAction?: () => void;
};

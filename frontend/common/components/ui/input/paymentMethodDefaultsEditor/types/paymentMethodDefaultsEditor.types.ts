// NEW FOR PLAN v5 (lifted from frontend/mobile/components/ui/input/paymentMethodDefaultsEditor/paymentMethodDefaultsEditor.types.ts)

import type { PaymentMethodRow } from "@/frontend/common/components/ui/display/paymentMethod/types";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import type { CurrencyOption } from "@/frontend/common/lib/currency";
import type { LocalizedString } from "@/shared/types";

// NEW FOR PLAN v5: PaymentMethodRow is reused from @/frontend/common/components/ui/display/paymentMethod/types (canonical common home per MA1 wave).
// NEW FOR PLAN v5: instructionsOpen / onInstructionsOpenChangeAction added as controlled-prop pattern (lifted from tier useState per specs.md §6 / N7).
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
  // NEW FOR PLAN v5: lifted from tier useState(instructionsOpen) per specs.md §6 / N7 controlled-prop pattern
  readonly instructionsOpen?: boolean;
  readonly onInstructionsOpenChangeAction?: (open: boolean) => void;
};

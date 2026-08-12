// NEW FOR PLAN v5: lifted to common to unify tier currencySelect duplicated type declarations.

import type { AutocompleteSharedProps } from "@/frontend/common/components/ui/input/autocompleteSharedProps.types";
import type { CurrencyAutocompleteProps } from "@/frontend/common/components/ui/input/currencySelect/types/currencyAutocomplete.types";
import type { CurrencyOption } from "@/frontend/common/lib/currency";

export type CurrencySelectProps = {
  readonly currency?: CurrencyOption | null;
  readonly setCurrencyAction: (currency: CurrencyOption) => void;
  readonly onClearAction?: () => void;
  readonly allowedCodes?: NonNullable<CurrencyAutocompleteProps["allowedCodes"]>;
  readonly excludedCodes?: NonNullable<CurrencyAutocompleteProps["excludedCodes"]>;
  readonly showSymbol?: boolean;
} & Omit<AutocompleteSharedProps, "matchAnchorWidth" | "disablePortal" | "listAttached">;

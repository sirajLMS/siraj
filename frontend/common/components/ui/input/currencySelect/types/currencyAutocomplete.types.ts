// NEW FOR PLAN v5: lifted to common to unify tier currencySelect duplicated type declarations.

import type { AutocompleteSharedProps } from "@/frontend/common/components/ui/input/autocompleteSharedProps.types";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import type { CurrencyOption } from "@/frontend/common/lib/currency";

export type CurrencyAutocompleteProps = {
  readonly currency?: CurrencyOption | null;
  readonly onChangeAction: (currency: CurrencyOption) => void;
  readonly onClearAction?: () => void;
  readonly allowedCodes?: readonly CurrencyCode[];
  readonly excludedCodes?: readonly CurrencyCode[];
  readonly showSymbol?: boolean;
} & AutocompleteSharedProps;

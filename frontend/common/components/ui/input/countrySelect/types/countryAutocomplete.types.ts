// NEW FOR PLAN v5: lifted to common to unify tier countrySelect duplicated type declarations.

import type { AutocompleteSharedProps } from "@/frontend/common/components/ui/input/autocompleteSharedProps.types";
import type { CountryType } from "@/frontend/common/lib/locale";

export type CountryAutocompleteProps = {
  readonly country?: CountryType | null;
  readonly onChangeAction: (country: CountryType) => void;
  readonly onClearAction?: () => void;
  readonly showPhonePrefix?: boolean;
} & AutocompleteSharedProps;

// NEW FOR PLAN v5: lifted to common to unify tier countrySelect duplicated type declarations.

import type { CountryAutocompleteProps } from "@/frontend/common/components/ui/input/countrySelect/types/countryAutocomplete.types";
import type { CountryType } from "@/frontend/common/lib/locale";

export type CountrySelectProps = {
  readonly country?: CountryType | null;
  readonly setCountryAction: (country: CountryType | null) => void;
} & Partial<CountryAutocompleteProps>;

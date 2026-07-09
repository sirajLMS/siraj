import type { CountrySelectLabels } from "./country-select";
import type { CurrencySelectLabels } from "./currency-select";
import type { GenderSelectorLabels } from "./gender-selector";
import type { LanguageSelectorLabels } from "./language-selector";
import type { PhoneInputLabels } from "./phone-input";
import type { TagInputLabels } from "./tag-input";
import type { TimezoneSelectLabels } from "./timezone-select";

export type {
  CountrySelectLabels,
  CurrencySelectLabels,
  GenderSelectorLabels,
  LanguageSelectorLabels,
  PhoneInputLabels,
  TagInputLabels,
  TimezoneSelectLabels,
};

export interface UiLabels {
  readonly genderSelector: GenderSelectorLabels;
  readonly countrySelect: CountrySelectLabels;
  readonly currencySelect: CurrencySelectLabels;
  readonly languageSelector: LanguageSelectorLabels;
  readonly phoneInput: PhoneInputLabels;
  readonly tagInput: TagInputLabels;
  readonly timezoneSelect: TimezoneSelectLabels;
}

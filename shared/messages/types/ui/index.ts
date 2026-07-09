import type { CountrySelectLabels } from "./country-select";
import type { GenderSelectorLabels } from "./gender-selector";
import type { LanguageSelectorLabels } from "./language-selector";
import type { TagInputLabels } from "./tag-input";
import type { TimezoneSelectLabels } from "./timezone-select";

export type { CountrySelectLabels, GenderSelectorLabels, LanguageSelectorLabels, TagInputLabels, TimezoneSelectLabels };

export interface UiLabels {
  readonly genderSelector: GenderSelectorLabels;
  readonly countrySelect: CountrySelectLabels;
  readonly languageSelector: LanguageSelectorLabels;
  readonly tagInput: TagInputLabels;
  readonly timezoneSelect: TimezoneSelectLabels;
}

import type { CountrySelectLabels } from "./country-select";
import type { GenderSelectorLabels } from "./gender-selector";
import type { LanguageSelectorLabels } from "./language-selector";
import type { TagInputLabels } from "./tag-input";

export type { CountrySelectLabels, GenderSelectorLabels, LanguageSelectorLabels, TagInputLabels };

export interface UiLabels {
  readonly genderSelector: GenderSelectorLabels;
  readonly countrySelect: CountrySelectLabels;
  readonly languageSelector: LanguageSelectorLabels;
  readonly tagInput: TagInputLabels;
}

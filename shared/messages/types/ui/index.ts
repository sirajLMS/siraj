import type { CatalogImageUploadLabels } from "./catalog-image-upload";
import type { CountrySelectLabels } from "./country-select";
import type { CurrencySelectLabels } from "./currency-select";
import type { GenderSelectorLabels } from "./gender-selector";
import type { LanguageSelectorLabels } from "./language-selector";
import type { LocalizedStringLabels } from "./localized-string";
import type { MeetingConfigLabels } from "./meeting-config";
import type { PaymentMethodLabels } from "./payment-method";
import type { PhoneInputLabels } from "./phone-input";
import type { TagInputLabels } from "./tag-input";
import type { TimezoneSelectLabels } from "./timezone-select";

export type {
  CatalogImageUploadLabels,
  CountrySelectLabels,
  CurrencySelectLabels,
  GenderSelectorLabels,
  LanguageSelectorLabels,
  LocalizedStringLabels,
  MeetingConfigLabels,
  PaymentMethodLabels,
  PhoneInputLabels,
  TagInputLabels,
  TimezoneSelectLabels,
};

export interface UiLabels {
  readonly catalogImageUpload: CatalogImageUploadLabels;
  readonly genderSelector: GenderSelectorLabels;
  readonly countrySelect: CountrySelectLabels;
  readonly currencySelect: CurrencySelectLabels;
  readonly languageSelector: LanguageSelectorLabels;
  readonly localizedString: LocalizedStringLabels;
  readonly phoneInput: PhoneInputLabels;
  readonly tagInput: TagInputLabels;
  readonly timezoneSelect: TimezoneSelectLabels;
  readonly meetingConfig: MeetingConfigLabels;
  readonly paymentMethod: PaymentMethodLabels;
}

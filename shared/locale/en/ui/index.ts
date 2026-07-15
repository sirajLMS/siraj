import type { UiLabels } from "@/shared/locale/types/ui";
import { catalogImageUpload } from "./catalog-image-upload";
import { countrySelect } from "./country-select";
import { currencySelect } from "./currency-select";
import { genderSelector } from "./gender-selector";
import { languageSelector } from "./language-selector";
import { localizedString } from "./localized-string";
import { meetingConfig } from "./meeting-config";
import { paymentMethod } from "./payment-method";
import { phoneInput } from "./phone-input";
import { tagInput } from "./tag-input";
import { timezoneSelect } from "./timezone-select";

export const ui: UiLabels = {
  catalogImageUpload,
  genderSelector,
  countrySelect,
  currencySelect,
  languageSelector,
  localizedString,
  phoneInput,
  tagInput,
  timezoneSelect,
  meetingConfig,
  paymentMethod,
};

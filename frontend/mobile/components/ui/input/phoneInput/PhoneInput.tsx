"use client";

import type * as React from "react";
import { BoxPrefixInput } from "@/frontend/common/components/ui/input/phoneInput/BoxPrefixInput";
import type { PhoneInputSharedProps } from "@/frontend/common/components/ui/input/phoneInput/PhoneInputShared";
import { createPhoneInputVariant } from "@/frontend/common/components/ui/input/phoneInput/phoneInputFactory";
import { createResolveHelperText } from "@/frontend/common/components/ui/input/phoneInput/phoneInputSharedUtils";
import { MobileLocaleEmoji } from "@/frontend/mobile/components/ui/display/localeEmoji";
import { PhoneCountryPickerMobile } from "@/frontend/mobile/components/ui/input/phoneInput/phoneCountryPicker.mobile";

export type PhoneInputProps = PhoneInputSharedProps;

const mobileResolveHelperText = createResolveHelperText(true);

export const PhoneInput: React.FC<PhoneInputProps> = createPhoneInputVariant({
  LocaleEmojiComponent: MobileLocaleEmoji,
  PhoneCountryPickerComponent: PhoneCountryPickerMobile,
  PrefixInputElement: BoxPrefixInput,
  resolveHelperText: mobileResolveHelperText,
  useOnNationalInput: false,
});

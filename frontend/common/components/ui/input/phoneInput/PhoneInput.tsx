"use client";

import type * as React from "react";
import { LocaleEmoji } from "@/frontend/common/components/ui/display";
import { BoxPrefixInput } from "@/frontend/common/components/ui/input/phoneInput/BoxPrefixInput";
import { PhoneCountryPicker } from "@/frontend/common/components/ui/input/phoneInput/PhoneCountryPicker";
import type { PhoneInputSharedProps } from "@/frontend/common/components/ui/input/phoneInput/PhoneInputShared";
import { createPhoneInputVariant } from "@/frontend/common/components/ui/input/phoneInput/phoneInputFactory";
import { createResolveHelperText } from "@/frontend/common/components/ui/input/phoneInput/phoneInputSharedUtils";

export type PhoneInputProps = PhoneInputSharedProps;

const commonResolveHelperText = createResolveHelperText(false);

export const PhoneInput: React.FC<PhoneInputProps> = createPhoneInputVariant({
  LocaleEmojiComponent: LocaleEmoji,
  PhoneCountryPickerComponent: PhoneCountryPicker,
  PrefixInputElement: BoxPrefixInput,
  resolveHelperText: commonResolveHelperText,
  useOnNationalInput: true,
});

"use client";

import { styled } from "@mui/material/styles";
import type * as React from "react";
import type { PhoneInputSharedProps } from "@/frontend/common/components/ui/input/phoneInput/PhoneInputShared";
import { createPhoneInputVariant } from "@/frontend/common/components/ui/input/phoneInput/phoneInputFactory";
import { createResolveHelperText } from "@/frontend/common/components/ui/input/phoneInput/phoneInputSharedUtils";
import { DesktopLocaleEmoji } from "@/frontend/desktop/components/ui/display/localeEmoji";
import { PhoneCountryPickerDesktop } from "@/frontend/desktop/components/ui/input/phoneInput/phoneCountryPicker.desktop";

export type PhoneInputProps = PhoneInputSharedProps;

const StyledInput = styled("input")();

const desktopResolveHelperText = createResolveHelperText(true);

export const PhoneInputDesktop: React.FC<PhoneInputProps> = createPhoneInputVariant({
  LocaleEmojiComponent: DesktopLocaleEmoji,
  PhoneCountryPickerComponent: PhoneCountryPickerDesktop,
  PrefixInputElement: StyledInput,
  resolveHelperText: desktopResolveHelperText,
  useOnNationalInput: false,
});

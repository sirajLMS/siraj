"use client";

import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import type * as React from "react";
import { LocaleEmoji } from "@/frontend/common/components/ui/display";
import { PhoneCountryPicker } from "@/frontend/common/components/ui/input/phoneInput/PhoneCountryPicker";
import type { PhoneInputSlotProps } from "@/frontend/common/components/ui/input/phoneInput/PhoneInputShared";
import { PhoneInputShared } from "@/frontend/common/components/ui/input/phoneInput/PhoneInputShared";

export type PhoneInputProps = {
  readonly value: string | null;
  readonly onChangeAction: (e164: string | null) => void;
  readonly onBlurAction?: () => void;
  readonly defaultRegion?: string;
  readonly label?: string;
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly fullWidth?: boolean;
  readonly error?: boolean;
  readonly helperText?: string;
  readonly hideLabel?: boolean;
};

const BoxPrefixInput: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & {
    readonly sx?: SxProps<Theme>;
    readonly ref?: React.Ref<HTMLInputElement>;
  }
> = ({ sx, ref, ...props }): React.ReactNode => <Box component="input" ref={ref} sx={sx} {...(props as object)} />;

const commonResolveHelperText: PhoneInputSlotProps["resolveHelperText"] = ({
  prefixInvalid,
  showRequiredError,
  phoneInvalid,
  helperText,
  t,
}) => {
  if (prefixInvalid) {
    return t.invalidPrefix;
  }
  if (showRequiredError) {
    return t.required;
  }
  if (helperText) {
    return helperText;
  }
  if (phoneInvalid) {
    return t.invalidPhone;
  }
  return undefined;
};

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChangeAction,
  onBlurAction,
  defaultRegion = "EG",
  label,
  placeholder,
  required,
  disabled,
  fullWidth = true,
  error,
  helperText,
  hideLabel,
}: PhoneInputProps): React.ReactNode => (
  <PhoneInputShared
    value={value}
    onChangeAction={onChangeAction}
    onBlurAction={onBlurAction}
    defaultRegion={defaultRegion}
    label={label}
    placeholder={placeholder}
    required={required}
    disabled={disabled}
    fullWidth={fullWidth}
    error={error}
    helperText={helperText}
    hideLabel={hideLabel}
    LocaleEmojiComponent={LocaleEmoji}
    PhoneCountryPickerComponent={PhoneCountryPicker}
    PrefixInputElement={BoxPrefixInput}
    resolveHelperText={commonResolveHelperText}
    useOnNationalInput
  />
);

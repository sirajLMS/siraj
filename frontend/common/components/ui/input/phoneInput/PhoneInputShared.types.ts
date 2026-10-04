import type { SxProps, Theme } from "@mui/material/styles";
import type * as React from "react";
import type { CountryType } from "@/frontend/common/lib/locale";

export type PhoneInputSharedProps = {
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

export type PhoneInputSlotProps = {
  readonly LocaleEmojiComponent: React.FC<{ readonly emoji: string }>;
  readonly PhoneCountryPickerComponent: React.FC<{
    readonly country: CountryType | undefined;
    readonly onSelectAction: (country: CountryType) => void;
  }>;
  readonly PrefixInputElement: React.FC<
    React.InputHTMLAttributes<HTMLInputElement> & {
      readonly sx?: SxProps<Theme>;
      readonly ref?: React.Ref<HTMLInputElement>;
    }
  >;
  readonly resolveHelperText: (params: {
    readonly prefixInvalid: boolean;
    readonly showRequiredError: boolean;
    readonly phoneInvalid: boolean;
    readonly helperText: string | undefined;
    readonly t: { readonly invalidPrefix: string; readonly required: string; readonly invalidPhone: string };
  }) => string | undefined;
  readonly useOnNationalInput: boolean;
};

export type PhoneInputScaffoldProps = PhoneInputSharedProps & PhoneInputSlotProps;

"use client";

import type * as React from "react";
import { usePhoneInputState } from "@/frontend/common/components/ui/input/phoneInput/PhoneInputShared.hooks";
import { PhoneInputView } from "@/frontend/common/components/ui/input/phoneInput/PhoneInputShared.parts";
import type {
  PhoneInputScaffoldProps,
  PhoneInputSharedProps,
  PhoneInputSlotProps,
} from "@/frontend/common/components/ui/input/phoneInput/PhoneInputShared.types";

export type { PhoneInputSharedProps, PhoneInputSlotProps };

export const PhoneInputShared: React.FC<PhoneInputScaffoldProps> = props => {
  const state = usePhoneInputState(props);
  return (
    <PhoneInputView
      state={state}
      fullWidth={props.fullWidth ?? true}
      required={props.required}
      disabled={props.disabled}
      placeholder={props.placeholder}
      onBlurAction={props.onBlurAction}
      useOnNationalInput={props.useOnNationalInput}
      LocaleEmojiComponent={props.LocaleEmojiComponent}
      PhoneCountryPickerComponent={props.PhoneCountryPickerComponent}
      PrefixInputElement={props.PrefixInputElement}
    />
  );
};

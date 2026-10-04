"use client";

import { useMemo } from "react";
import type { PhoneInputSlotProps } from "@/frontend/common/components/ui/input/phoneInput/PhoneInputShared.types";
import { usePhoneInput } from "@/frontend/common/hooks/usePhoneInput";
import { Translation, useAppTranslation } from "@/shared/locale";

type PhoneInputStateParams = {
  readonly value: string | null;
  readonly onChangeAction: (e164: string | null) => void;
  readonly defaultRegion?: string;
  readonly disabled?: boolean;
  readonly required?: boolean;
  readonly error?: boolean;
  readonly helperText?: string;
  readonly label?: string;
  readonly hideLabel?: boolean;
  readonly resolveHelperText: PhoneInputSlotProps["resolveHelperText"];
};

type PhoneInputLabels = {
  readonly selectCountry: string;
  readonly countryCallingCode: string;
  readonly phoneNumber: string;
};

export type PhoneInputState = ReturnType<typeof usePhoneInput> & {
  readonly showError: boolean;
  readonly resolvedLabel: string | undefined;
  readonly resolvedHelperText: string | undefined;
  readonly labels: PhoneInputLabels;
};

export function usePhoneInputState({
  value,
  onChangeAction,
  defaultRegion,
  disabled,
  required,
  error,
  helperText,
  label,
  hideLabel,
  resolveHelperText,
}: PhoneInputStateParams): PhoneInputState {
  const t = useAppTranslation(Translation.Ui.PhoneInput);
  const raw = usePhoneInput({ value, onChangeAction, defaultRegion: defaultRegion ?? "EG", disabled });

  const isEmpty = raw.prefixDigits.length === 0 && raw.nationalDigits.length === 0;
  const showRequiredError = Boolean(required) && isEmpty;
  const showError = Boolean(error) || raw.prefixInvalid || showRequiredError || raw.phoneInvalid;
  const resolvedHelperText = resolveHelperText({
    prefixInvalid: raw.prefixInvalid,
    showRequiredError,
    phoneInvalid: raw.phoneInvalid,
    helperText,
    t,
  });
  const resolvedLabel = hideLabel ? undefined : (label ?? t.label);
  const labels = useMemo(
    () => ({ selectCountry: t.selectCountry, countryCallingCode: t.countryCallingCode, phoneNumber: t.phoneNumber }),
    [t.selectCountry, t.countryCallingCode, t.phoneNumber]
  );

  return { ...raw, showError, resolvedLabel, resolvedHelperText, labels };
}

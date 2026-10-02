"use client";

import { useCallback, useMemo } from "react";
import { type CountryType, getCountryByCode } from "@/frontend/common/lib/locale";

export type NationalIdInputValue = { countryCode: string | null; number: string } | null;

type UseNationalIdInputParams = {
  readonly value: NationalIdInputValue;
  readonly onChangeAction: (value: NationalIdInputValue) => void;
  readonly defaultCountry?: string;
};

/**
 * State logic for the national ID input — fully controlled by the parent
 * (the form or the story holds the `{ countryCode, number }` object).
 *
 * The country is derived from the value's `countryCode` (falling back to
 * `defaultCountry`); typing emits a digit-filtered number so non-numeric
 * characters never enter the value object.
 */
export function useNationalIdInput({ value, onChangeAction, defaultCountry = "EG" }: UseNationalIdInputParams) {
  const country = useMemo<CountryType | undefined>(
    () => getCountryByCode(value?.countryCode ?? defaultCountry),
    [value?.countryCode, defaultCountry]
  );

  const countryCode = country?.code.toString() ?? null;
  const number = value?.number ?? "";

  const emit = useCallback(
    (nextNumber: string, nextCountryCode: string | null) => {
      const trimmed = nextNumber.trim();
      // Preserve the country selection even when the number is empty so the
      // user can pick a country before typing; only a fully empty value (no
      // country and no number) collapses to `null`.
      if (!trimmed && !nextCountryCode) {
        onChangeAction(null);
        return;
      }
      onChangeAction({ countryCode: nextCountryCode, number: trimmed });
    },
    [onChangeAction]
  );

  const handleNumberChange = useCallback(
    (raw: string) => {
      emit(raw.replace(/\D/g, ""), countryCode);
    },
    [countryCode, emit]
  );

  const handleCountrySelect = useCallback(
    (selected: CountryType) => {
      emit(number, selected.code.toString());
    },
    [emit, number]
  );

  return {
    country,
    countryCode,
    number,
    handleNumberChange,
    handleCountrySelect,
  };
}

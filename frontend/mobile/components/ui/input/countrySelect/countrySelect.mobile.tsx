"use client";

import type * as React from "react";
import type { CountryAutocompleteProps } from "@/frontend/common/components/ui/input/countrySelect/CountryAutocomplete";
import type { CountrySelectProps } from "@/frontend/common/components/ui/input/countrySelect/CountrySelect";
import { CountryAutocompleteMobile } from "@/frontend/mobile/components/ui/input/countrySelect/countryAutocomplete.mobile";

/**
 * CountrySelectMobile component allows users to select a country from a dropdown list.
 */
export const CountrySelectMobile: React.FC<CountrySelectProps> = ({
  country,
  setCountryAction,
  ...props
}: CountrySelectProps): React.ReactNode => {
  const autocompleteProps: CountryAutocompleteProps = {
    country,
    onChangeAction: setCountryAction,
    showPhonePrefix: true,
    matchAnchorWidth: true,
    ...props,
  };

  return <CountryAutocompleteMobile {...autocompleteProps} />;
};

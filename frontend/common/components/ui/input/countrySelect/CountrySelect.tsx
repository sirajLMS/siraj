"use client";

import type * as React from "react";
import { CountryAutocomplete } from "@/frontend/common/components/ui/input/countrySelect/CountryAutocomplete";
import type {
  CountryAutocompleteProps,
  CountrySelectProps,
} from "@/frontend/common/components/ui/input/countrySelect/types";

/**
 * CountrySelect component allows users to select a country from a dropdown list.
 */
export const CountrySelect: React.FC<CountrySelectProps> = ({
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

  return <CountryAutocomplete {...autocompleteProps} />;
};

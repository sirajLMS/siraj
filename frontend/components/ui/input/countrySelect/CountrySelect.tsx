"use client";

import type * as React from "react";
import {
  CountryAutocomplete,
  type CountryAutocompleteProps,
} from "@/frontend/components/ui/input/countrySelect/CountryAutocomplete";
import type { CountryType } from "@/frontend/lib/locale";

export type CountrySelectProps = {
  readonly country?: CountryType;
  readonly setCountryAction: (country: CountryType) => void;
  readonly autoComplete?: string;
  readonly fullWidth?: boolean;
  readonly required?: boolean;
  readonly label?: string;
  readonly onBlurAction?: () => void;
  readonly style?: React.CSSProperties;
  readonly open?: boolean;
  readonly onOpenAction?: () => void;
  readonly onCloseAction?: () => void;
  readonly autoFocus?: boolean;
};

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

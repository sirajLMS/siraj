"use client";

import type * as React from "react";
import type { CountryType } from "@/frontend/common/lib/locale";
import { CountryAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/countrySelect/countryAutocomplete.desktop";

export type CountryAutocompleteProps = {
  readonly country?: CountryType | null;
  readonly onChangeAction: (country: CountryType) => void;
  readonly onClearAction?: () => void;
  readonly autoComplete?: string;
  readonly fullWidth?: boolean;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly label?: string;
  readonly error?: boolean;
  readonly helperText?: string;
  readonly onBlurAction?: () => void;
  readonly style?: React.CSSProperties;
  readonly open?: boolean;
  readonly onOpenAction?: () => void;
  readonly onCloseAction?: () => void;
  readonly autoFocus?: boolean;
  readonly showPhonePrefix?: boolean;
  readonly matchAnchorWidth?: boolean;
  readonly disablePortal?: boolean;
  readonly listAttached?: boolean;
};

export type CountrySelectProps = {
  readonly country?: CountryType | null;
  readonly setCountryAction: (country: CountryType | null) => void;
} & Partial<CountryAutocompleteProps>;

/**
 * CountrySelectDesktop component allows users to select a country from a dropdown list.
 */
export const CountrySelectDesktop: React.FC<CountrySelectProps> = ({
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

  return <CountryAutocompleteDesktop {...autocompleteProps} />;
};

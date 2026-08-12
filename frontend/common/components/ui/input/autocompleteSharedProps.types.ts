// Shared base props for Autocomplete-style select components (currency, payment method, country).
// Eliminates clone pairs between currencyAutocomplete.types.ts and paymentMethodAutocomplete.types.ts / paymentMethodSelect.types.ts.

export type AutocompleteSharedProps = {
  readonly autoComplete?: string;
  readonly fullWidth?: boolean;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly label?: string;
  readonly placeholder?: string;
  readonly error?: boolean;
  readonly helperText?: string;
  readonly onBlurAction?: () => void;
  readonly style?: React.CSSProperties;
  readonly open?: boolean;
  readonly onOpenAction?: () => void;
  readonly onCloseAction?: () => void;
  readonly autoFocus?: boolean;
  readonly matchAnchorWidth?: boolean;
  readonly disablePortal?: boolean;
  readonly listAttached?: boolean;
};

// NEW FOR PLAN v5: lifted to common to unify tier currencySelect duplicated type declarations.

import type { CurrencyAutocompleteProps } from "@/frontend/common/components/ui/input/currencySelect/types/currencyAutocomplete.types";
import type { CurrencyOption } from "@/frontend/common/lib/currency";

export type CurrencySelectProps = {
  readonly currency?: CurrencyOption | null;
  readonly setCurrencyAction: (currency: CurrencyOption) => void;
  readonly onClearAction?: () => void;
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
  readonly allowedCodes?: CurrencyAutocompleteProps["allowedCodes"];
  readonly excludedCodes?: CurrencyAutocompleteProps["excludedCodes"];
  readonly showSymbol?: boolean;
};

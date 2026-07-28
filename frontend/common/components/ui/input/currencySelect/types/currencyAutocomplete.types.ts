// NEW FOR PLAN v5: lifted to common to unify tier currencySelect duplicated type declarations.
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { CurrencyOption } from "@/frontend/common/lib/currency";

export type CurrencyAutocompleteProps = {
  readonly currency?: CurrencyOption | null;
  readonly onChangeAction: (currency: CurrencyOption) => void;
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
  readonly allowedCodes?: readonly CurrencyCode[];
  readonly excludedCodes?: readonly CurrencyCode[];
  readonly matchAnchorWidth?: boolean;
  readonly disablePortal?: boolean;
  readonly listAttached?: boolean;
  readonly showSymbol?: boolean;
};

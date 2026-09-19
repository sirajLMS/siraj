import type { AutocompleteProps } from "@mui/material/Autocomplete";
import type { SxProps, Theme } from "@mui/material/styles";
import type * as React from "react";
import type { CurrencyAutocompleteProps } from "@/frontend/common/components/ui/input/currencySelect/types/currencyAutocomplete.types";
import type { CurrencyOption } from "@/frontend/common/lib/currency";

type AutocompleteInternalSlotProps = NonNullable<AutocompleteProps<CurrencyOption, false, false, false>["slotProps"]>;

type CurrencyAutocompletePopperOptions = {
  readonly matchAnchorWidth: boolean;
  readonly disablePortal: boolean;
  readonly listAttached: boolean;
};

type GetPopperSlotProps = (
  options: CurrencyAutocompletePopperOptions
) => NonNullable<AutocompleteInternalSlotProps["popper"]>;
type GetPaperSlotProps = (listAttached: boolean) => AutocompleteInternalSlotProps["paper"];

export type LocaleEmojiComponent = React.FC<{ readonly emoji: string }>;

export type CurrencyOptionRowComponent = React.FC<{
  readonly currency: CurrencyOption;
  readonly locale: string;
  readonly showSymbol: boolean;
}>;

interface CurrencyAutocompleteSlotProps {
  /** Component used to render the flag emoji in the input start adornment */
  readonly LocaleEmojiComponent: LocaleEmojiComponent;
  /** Component used to render each currency option row in the dropdown */
  readonly CurrencyOptionRowComponent: CurrencyOptionRowComponent;
  /** Popper slot props factory for the Autocomplete popper */
  readonly getPopperSlotProps: GetPopperSlotProps;
  /** Paper slot props factory for the Autocomplete paper */
  readonly getPaperSlotProps: GetPaperSlotProps;
  /** sx applied to each option row <Box component="li"> (mobile uses larger touch targets) */
  readonly optionRowSx?: SxProps<Theme>;
  /** Default value for the `fullWidth` prop (mobile defaults to true) */
  readonly fullWidthDefault?: boolean;
}

/** Catalog data supplied by the caller. Data-bound wrappers (`CurrencyAutocomplete`
 *  and its tier variants) fetch it via `useCurrencyCatalog`; stories pass static lists. */
interface CurrencyAutocompleteCatalogProps {
  readonly options: readonly CurrencyOption[];
  /** Whether the full catalog has loaded; while false only the selected currency is offered. */
  readonly catalogLoaded?: boolean;
}

export type CurrencyAutocompleteSharedProps = CurrencyAutocompleteProps &
  CurrencyAutocompleteSlotProps &
  CurrencyAutocompleteCatalogProps;

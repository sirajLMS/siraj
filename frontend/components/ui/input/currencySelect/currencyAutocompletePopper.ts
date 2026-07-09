import type { AutocompleteProps } from "@mui/material/Autocomplete";
import type { Theme } from "@mui/material/styles";
import type { CurrencyOption } from "@/frontend/lib/currency";

type CurrencyAutocompleteSlotProps = NonNullable<
  AutocompleteProps<CurrencyOption, false, false, false>["slotProps"]
>;

export function getCurrencyAutocompletePopperSlotProps(options: {
  readonly matchAnchorWidth: boolean;
  readonly disablePortal: boolean;
  readonly listAttached: boolean;
}): NonNullable<CurrencyAutocompleteSlotProps["popper"]> {
  const { matchAnchorWidth, disablePortal, listAttached } = options;

  return {
    disablePortal,
    placement: "bottom-start",
    modifiers: [
      {
        Name: "offset",
        options: {
          offset: [0, listAttached ? 0 : 4],
        },
      },
    ],
    sx: matchAnchorWidth
      ? {
          width: "100%",
          minWidth: "100%",
        }
      : undefined,
  };
}

export function getCurrencyAutocompletePaperSlotProps(
  listAttached: boolean
): CurrencyAutocompleteSlotProps["paper"] {
  if (!listAttached) {
    return undefined;
  }

  return {
    sx: (theme: Theme) => ({
      mt: 0,
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      borderTopWidth: 0,
      boxShadow: theme.shadows[4],
    }),
  };
}

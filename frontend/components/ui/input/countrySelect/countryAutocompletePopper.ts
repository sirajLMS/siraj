import type { AutocompleteProps } from "@mui/material/Autocomplete";
import type { Theme } from "@mui/material/styles";
import type { CountryType } from "@/frontend/lib/locale";

type CountryAutocompleteSlotProps = NonNullable<AutocompleteProps<CountryType, false, false, false>["slotProps"]>;

export function getCountryAutocompletePopperSlotProps(options: {
  readonly matchAnchorWidth: boolean;
  readonly disablePortal: boolean;
  readonly listAttached: boolean;
}): NonNullable<CountryAutocompleteSlotProps["popper"]> {
  const { matchAnchorWidth, disablePortal, listAttached } = options;

  return {
    disablePortal,
    placement: "bottom-start",
    modifiers: [
      {
        name: "offset",
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

export function getCountryAutocompletePaperSlotProps(listAttached: boolean): CountryAutocompleteSlotProps["paper"] {
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

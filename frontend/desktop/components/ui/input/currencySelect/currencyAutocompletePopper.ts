import type { AutocompleteProps } from "@mui/material/Autocomplete";
import type { Theme } from "@mui/material/styles";
import type { Modifier } from "@popperjs/core";
import type { CurrencyOption } from "@/frontend/common/lib/currency";

type CurrencyAutocompleteSlotProps = NonNullable<AutocompleteProps<CurrencyOption, false, false, false>["slotProps"]>;

const sameWidthModifier: Modifier<"sameWidth", Record<string, unknown>> = {
  name: "sameWidth",
  enabled: true,
  phase: "beforeWrite",
  requires: ["computeStyles"],
  fn: ({ state }) => {
    const anchor = state.rects.reference;
    if (anchor) {
      state.styles.popper = {
        ...state.styles.popper,
        width: `${anchor.width}px`,
        minWidth: `${anchor.width}px`,
      };
    }
  },
};

/**
 * Desktop-tier duplicate of `@/frontend/common/components/ui/input/currencySelect/currencyAutocompletePopper`.
 */
export function getCurrencyAutocompletePopperSlotPropsDesktop(options: {
  readonly matchAnchorWidth: boolean;
  readonly disablePortal: boolean;
  readonly listAttached: boolean;
}): NonNullable<CurrencyAutocompleteSlotProps["popper"]> {
  const { matchAnchorWidth, disablePortal, listAttached } = options;

  return {
    disablePortal,
    placement: "bottom-start",
    modifiers: matchAnchorWidth
      ? [
          sameWidthModifier,
          {
            name: "offset",
            options: {
              offset: [0, listAttached ? 0 : 4],
            },
          },
        ]
      : [
          {
            name: "offset",
            options: {
              offset: [0, listAttached ? 0 : 4],
            },
          },
        ],
    sx: matchAnchorWidth
      ? {
          width: "fit-content",
          minWidth: "fit-content",
        }
      : undefined,
  };
}

export function getCurrencyAutocompletePaperSlotPropsDesktop(
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

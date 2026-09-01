import type { AutocompleteProps } from "@mui/material/Autocomplete";
import type { Theme } from "@mui/material/styles";
import type { Modifier } from "@popperjs/core";

export type AutocompleteSlotProps<T> = NonNullable<AutocompleteProps<T, false, false, false>["slotProps"]>;

export type AutocompletePopperOptions = {
  readonly matchAnchorWidth: boolean;
  readonly disablePortal: boolean;
  readonly listAttached: boolean;
};

const sameWidthModifier: Modifier<"sameWidth", Record<string, unknown>> = {
  name: "sameWidth",
  enabled: true,
  phase: "beforeWrite",
  requires: ["computeStyles"],
  fn: ({ state }) => {
    const anchor = state.rects.reference;
    if (anchor) {
      state.styles.popper = Object.assign({}, state.styles.popper, {
        width: `${anchor.width}px`,
        minWidth: `${anchor.width}px`,
      });
    }
  },
};

export function createAutocompletePopperSlotProps<T>(
  options: AutocompletePopperOptions
): NonNullable<AutocompleteSlotProps<T>["popper"]> {
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

export function createAutocompletePaperSlotProps<T>(listAttached: boolean): AutocompleteSlotProps<T>["paper"] {
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

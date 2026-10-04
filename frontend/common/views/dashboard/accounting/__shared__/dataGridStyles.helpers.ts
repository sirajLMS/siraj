import type { Theme } from "@mui/material/styles";

/**
 * The MUI X grid hides its horizontal scrollbar on overlay-scrollbar
 * platforms (macOS, Gnome Web) until the user guesses at scrolling, so a
 * clipped trailing column reads as the end of the table. Painting a persistent
 * thin thumb/track on the grid's horizontal scrollbar element keeps off-frame
 * columns discoverable; the element only exists while columns overflow, so no
 * cue appears when everything fits.
 */
export const SCROLLBAR_CUE_SX = (theme: Theme) => ({
  "& .MuiDataGrid-scrollbar--horizontal": {
    scrollbarWidth: "thin",
    scrollbarColor: `${theme.palette.action.active} ${theme.palette.action.hover}`,
    "&::-webkit-scrollbar": {
      height: 8,
    },
    "&::-webkit-scrollbar-track": {
      backgroundColor: theme.palette.action.hover,
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: theme.palette.action.active,
      borderRadius: theme.shape.borderRadius,
    },
  },
});

/**
 * Zero-row geometry: the collapsed grid body would otherwise be shorter than
 * the empty-state panel, so the panel would overflow under the footer. A
 * min-height reserved while there are no rows gives the panel its room; once
 * rows exist, the grid stretches past it on its own.
 */
export const EMPTY_GRID_MIN_HEIGHT_SX = {
  minHeight: 400,
} as const;

/** Ellipsized single-line text content for truncated cell values. */
export const ELLIPSIZED_TEXT_SX = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;

/** Placeholder color for cells whose value is absent — always distinct from real values. */
export const EMPTY_VALUE_SX = (theme: Theme) => ({ color: theme.palette.text.disabled });

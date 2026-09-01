"use client";

import { Chip } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

export interface FilterChipProps {
  readonly label: string;
  /**
   * When provided, the chip renders a delete affordance that clears the
   * active filter. Omit it for a read-only indicator of applied filters.
   */
  readonly onClear?: () => void;
  readonly sx?: SxProps<Theme>;
}

/**
 * Dismissible chip that surfaces an active filter selection (e.g. an applied
 * metric filter) next to section chrome. Both tiers render this shared
 * primitive — pass `onClear` from the ViewModel handler when dismissal is
 * supported.
 */
export function FilterChip({ label, onClear, sx }: Readonly<FilterChipProps>) {
  return <Chip size="small" variant="outlined" label={label} onDelete={onClear} sx={sx} />;
}

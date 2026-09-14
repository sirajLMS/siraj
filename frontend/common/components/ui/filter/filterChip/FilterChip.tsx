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
  /** Text direction hint for mixed-script labels (e.g. LTR phone numbers). */
  readonly dir?: "ltr" | "rtl" | "auto";
  readonly sx?: SxProps<Theme>;
}

/**
 * Dismissible chip that surfaces an active filter selection (e.g. an applied
 * metric filter) next to section chrome. Both tiers render this shared
 * primitive — pass `onClear` from the ViewModel handler when dismissal is
 * supported.
 */
export function FilterChip({ label, onClear, dir, sx }: Readonly<FilterChipProps>) {
  return <Chip size="small" variant="outlined" label={label} onDelete={onClear} dir={dir} sx={sx} />;
}

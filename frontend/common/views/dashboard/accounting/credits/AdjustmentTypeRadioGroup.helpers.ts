import type { Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { CreditAdjustmentType } from "@/shared/constants/billing";

export interface AdjustmentTypeOptionConfig {
  readonly value: CreditAdjustmentType;
  readonly icon: ReactNode;
  readonly accent: "success" | "error" | "warning";
}

/** Maps the raw radio `value` string back to the shared enum, rejecting unknown input. */
export function parseAdjustmentType(value: string): CreditAdjustmentType | null {
  if (value === "ADD") return CreditAdjustmentType.ADD;
  if (value === "SUBTRACT") return CreditAdjustmentType.SUBTRACT;
  if (value === "SUBTRACT_WITH_CARRYOVER") return CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER;
  return null;
}

/**
 * Neutral eyebrow color for the section heading. The per-preset
 * `onSurfaceVariant` and `text.secondary` tokens are tinted toward the preset
 * accent family (ocean renders them cyan), so the MUI `grey` ramp — the only
 * palette family presets never override — supplies the desaturated tone.
 */
export function neutralSectionLabelColor(theme: Theme): string {
  return theme.palette.mode === "dark" ? theme.palette.grey[400] : theme.palette.grey[700];
}

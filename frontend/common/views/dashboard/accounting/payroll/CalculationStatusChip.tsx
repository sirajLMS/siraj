"use client";

import { Chip } from "@mui/material";
import { CalculationStatus } from "@/frontend/common/graphql/generated/gql/graphql";

type CalculationStatusChipColor = "default" | "info" | "warning" | "error" | "secondary" | "success";

/**
 * Semantic theme color per payroll calculation status:
 * refund (red), calculated (blue), not calculated (grey), partially (amber),
 * waiting paid (indigo), paid (green). Chip colors resolve through
 * `theme.palette`, so light/dark modes and palette presets stay honored.
 */
const CALCULATION_STATUS_CHIP_COLORS: Record<CalculationStatus, CalculationStatusChipColor> = {
  [CalculationStatus.Refund]: "error",
  [CalculationStatus.Calculated]: "info",
  [CalculationStatus.NotCalculated]: "default",
  [CalculationStatus.Partially]: "warning",
  [CalculationStatus.WaitingPaid]: "secondary",
  [CalculationStatus.Paid]: "success",
};

export interface CalculationStatusChipProps {
  /** Calculation status of a payroll row; null renders nothing (the grid shows its own null marker). */
  readonly status: CalculationStatus | null;
  /** Localized status labels keyed by calculation status. */
  readonly labels: Record<CalculationStatus, string>;
}

export function CalculationStatusChip({ status, labels }: Readonly<CalculationStatusChipProps>) {
  if (status === null) return null;
  const label = labels[status];
  return <Chip size="small" color={CALCULATION_STATUS_CHIP_COLORS[status]} label={label} aria-label={label} />;
}

"use client";

import { AddCircleOutlined, RemoveCircleOutlined, SwapHorizOutlined } from "@mui/icons-material";
import { FormControl, FormLabel, RadioGroup } from "@mui/material";
import { type ChangeEvent, useId } from "react";
import { useCreditAdjustFormStore } from "@/frontend/common/stores/creditAdjustFormStore";
import {
  type AdjustmentTypeOptionConfig,
  neutralSectionLabelColor,
  parseAdjustmentType,
} from "@/frontend/common/views/dashboard/accounting/credits/AdjustmentTypeRadioGroup.helpers";
import { AdjustmentTypeOptionCard } from "@/frontend/common/views/dashboard/accounting/credits/AdjustmentTypeRadioGroup.parts";
import { CreditAdjustmentType } from "@/shared/constants/billing";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardBillingCreditAdjustment } from "@/shared/locale/namespaces";

/** Display order and accent mapping; the first option is also the store default. */
const OPTION_CONFIG: readonly AdjustmentTypeOptionConfig[] = [
  { value: CreditAdjustmentType.ADD, icon: <AddCircleOutlined />, accent: "success" },
  { value: CreditAdjustmentType.SUBTRACT, icon: <RemoveCircleOutlined />, accent: "error" },
  { value: CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER, icon: <SwapHorizOutlined />, accent: "warning" },
];

export interface AdjustmentTypeRadioGroupProps {
  /** Accessible group label, rendered as the visible section heading above the options. */
  readonly sectionTitle: string;
}

/**
 * Adjustment type picker for the credit adjustment form.
 *
 * Leaving the carryover path clears the carryover fields from the form state in
 * the same interaction — the deduction no longer allocates a teacher payout, so
 * stale carryover selections must not leak into a plain Add or Subtract. The
 * store keeps the two actions separate on purpose; this control owns the pairing.
 */
export function AdjustmentTypeRadioGroup({ sectionTitle }: AdjustmentTypeRadioGroupProps) {
  const labels = useAppTranslation(DashboardBillingCreditAdjustment);
  const labelId = useId();
  const adjustmentType = useCreditAdjustFormStore(state => state.adjustmentType);
  const setAdjustmentType = useCreditAdjustFormStore(state => state.setAdjustmentType);
  const clearCarryover = useCreditAdjustFormStore(state => state.clearCarryover);

  const labelByType: Record<CreditAdjustmentType, string> = {
    [CreditAdjustmentType.ADD]: labels.adjustmentType.add,
    [CreditAdjustmentType.SUBTRACT]: labels.adjustmentType.subtract,
    [CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER]: labels.adjustmentType.subtractWithCarryover,
  };

  const descriptionByType: Record<CreditAdjustmentType, string> = {
    [CreditAdjustmentType.ADD]: labels.adjustmentType.addDescription,
    [CreditAdjustmentType.SUBTRACT]: labels.adjustmentType.subtractDescription,
    [CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER]: labels.adjustmentType.subtractWithCarryoverDescription,
  };

  const handleChange = (_event: ChangeEvent<HTMLInputElement>, value: string) => {
    const next = parseAdjustmentType(value);
    if (next === null) return;
    setAdjustmentType(next);
    if (next !== CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER) {
      clearCarryover();
    }
  };

  return (
    <FormControl sx={{ width: "100%" }}>
      <FormLabel
        id={labelId}
        sx={theme => ({
          ...theme.typography.labelUppercase,
          color: neutralSectionLabelColor(theme),
          mb: 1,
          // MUI tints the group label with the primary color while the control
          // is focused; section headings stay neutral in every state.
          "&.Mui-focused": { color: neutralSectionLabelColor(theme) },
        })}
      >
        {sectionTitle}
      </FormLabel>
      <RadioGroup
        aria-labelledby={labelId}
        value={adjustmentType}
        onChange={handleChange}
        sx={{ flexDirection: { xs: "column", sm: "row" }, gap: 1.5, alignItems: "stretch" }}
      >
        {OPTION_CONFIG.map(option => (
          <AdjustmentTypeOptionCard
            key={option.value}
            config={option}
            label={labelByType[option.value]}
            description={descriptionByType[option.value]}
            selected={option.value === adjustmentType}
          />
        ))}
      </RadioGroup>
    </FormControl>
  );
}

"use client";

import { AddCircleOutlined, RemoveCircleOutlined, SwapHorizOutlined } from "@mui/icons-material";
import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { type ChangeEvent, type ReactNode, useId } from "react";
import { useCreditAdjustFormStore } from "@/frontend/common/stores/creditAdjustFormStore";
import { CreditAdjustmentType } from "@/shared/constants/billing";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardBillingCreditAdjustment } from "@/shared/locale/namespaces";

/** Semantic accent role for each adjustment type (theme palette family names). */
type AdjustmentAccent = "success" | "error" | "warning";

interface AdjustmentTypeOptionConfig {
  readonly value: CreditAdjustmentType;
  readonly icon: ReactNode;
  readonly accent: AdjustmentAccent;
}

/** Display order and accent mapping; the first option is also the store default. */
const OPTION_CONFIG: readonly AdjustmentTypeOptionConfig[] = [
  { value: CreditAdjustmentType.ADD, icon: <AddCircleOutlined />, accent: "success" },
  { value: CreditAdjustmentType.SUBTRACT, icon: <RemoveCircleOutlined />, accent: "error" },
  { value: CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER, icon: <SwapHorizOutlined />, accent: "warning" },
];

/** Resolved Material 3 tone triple for a semantic family. */
interface AccentTones {
  readonly main: string;
  readonly container: string;
  readonly onContainer: string;
}

const ACCENT_TONES: Record<AdjustmentAccent, (theme: Theme) => AccentTones> = {
  success: theme => ({
    main: theme.palette.success.main,
    container: theme.palette.successContainer,
    onContainer: theme.palette.onSuccessContainer,
  }),
  error: theme => ({
    main: theme.palette.error.main,
    container: theme.palette.errorContainer,
    onContainer: theme.palette.onErrorContainer,
  }),
  warning: theme => ({
    main: theme.palette.warning.main,
    container: theme.palette.warningContainer,
    onContainer: theme.palette.onWarningContainer,
  }),
};

/** The radio control stays focusable for keyboard navigation while the card carries the visual affordance. */
const hiddenRadioSx = {
  position: "absolute",
  width: "1px",
  height: "1px",
  overflow: "hidden",
  opacity: 0,
  pointerEvents: "none",
} as const;

function buildCardSx(theme: Theme, tones: AccentTones, selected: boolean): SxProps<Theme> {
  return {
    m: 0,
    flex: 1,
    minWidth: 0,
    alignItems: "flex-start",
    gap: 1,
    px: 2,
    py: 2,
    cursor: "pointer",
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: 2,
    borderColor: selected ? tones.main : theme.palette.outlineVariant,
    backgroundColor: selected ? tones.container : theme.palette.surface,
    "&:hover": { borderColor: tones.main },
    "&:focus-within": { borderColor: tones.main, outline: "2px solid", outlineColor: tones.main, outlineOffset: "1px" },
    // The label slot stretches so the card content fills the clickable area.
    "& .MuiFormControlLabel-label": { flex: 1 },
  };
}

/** Maps the raw radio `value` string back to the shared enum, rejecting unknown input. */
function parseAdjustmentType(value: string): CreditAdjustmentType | null {
  if (value === "ADD") return CreditAdjustmentType.ADD;
  if (value === "SUBTRACT") return CreditAdjustmentType.SUBTRACT;
  if (value === "SUBTRACT_WITH_CARRYOVER") return CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER;
  return null;
}

interface AdjustmentTypeOptionCardProps {
  readonly config: AdjustmentTypeOptionConfig;
  readonly label: string;
  readonly selected: boolean;
}

function AdjustmentTypeOptionCard({ config, label, selected }: AdjustmentTypeOptionCardProps) {
  const theme = useTheme();
  const tones = ACCENT_TONES[config.accent](theme);
  return (
    <FormControlLabel
      value={config.value}
      control={<Radio sx={hiddenRadioSx} />}
      label={
        <Stack sx={{ gap: 0.5 }}>
          <Stack aria-hidden sx={{ color: tones.main }}>
            {config.icon}
          </Stack>
          <Typography
            sx={{
              fontWeight: 600,
              lineHeight: 1.3,
              color: selected ? tones.onContainer : theme.palette.onSurface,
            }}
          >
            {label}
          </Typography>
        </Stack>
      }
      sx={buildCardSx(theme, tones, selected)}
    />
  );
}

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
        sx={theme => ({ ...theme.typography.labelUppercase, color: theme.palette.onSurfaceVariant, mb: 1 })}
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
            selected={option.value === adjustmentType}
          />
        ))}
      </RadioGroup>
    </FormControl>
  );
}

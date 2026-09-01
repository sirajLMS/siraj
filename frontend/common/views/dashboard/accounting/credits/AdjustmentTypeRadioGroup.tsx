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
import { alpha, type SxProps, type Theme } from "@mui/material/styles";
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

/** Resolved family tones for a semantic accent (theme palette main + M3 onContainer text). */
interface AccentTones {
  readonly main: string;
  readonly onContainer: string;
}

const ACCENT_TONES: Record<AdjustmentAccent, (theme: Theme) => AccentTones> = {
  success: theme => ({
    main: theme.palette.success.main,
    onContainer: theme.palette.onSuccessContainer,
  }),
  error: theme => ({
    main: theme.palette.error.main,
    onContainer: theme.palette.onErrorContainer,
  }),
  warning: theme => ({
    main: theme.palette.warning.main,
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
    // Mobile rows are horizontal and compact; from `sm` up the icon stacks
    // above the label and the cards sit side by side. The stretch alignment
    // lets the label slot span the full card height so the icon+label group
    // can center vertically when a wrapped sibling makes the row taller.
    alignItems: { xs: "center", sm: "stretch" },
    gap: 1,
    px: 2,
    py: { xs: 1.5, sm: 2 },
    cursor: "pointer",
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: 2,
    // One selection language for every option: a subtle translucent family
    // tint + single accent border (the container tokens read as saturated
    // fills in dark mode). Unselected cards stay flat on `surface` with the
    // full-strength divider border so they read as tappable boxes.
    borderColor: selected ? tones.main : theme.palette.divider,
    backgroundColor: selected ? alpha(tones.main, 0.1) : theme.palette.surface,
    "&:hover": { borderColor: tones.main },
    // Ring only for keyboard focus (`.Mui-focusVisible`); a mouse click
    // focuses the hidden radio too, and a focus-within rule would leave a
    // second border ring on the last-clicked card indefinitely.
    "&:has(.Mui-focusVisible)": {
      outline: "2px solid",
      outlineColor: tones.main,
      outlineOffset: "1px",
    },
    // The label slot stretches so the card content fills the clickable area.
    "& .MuiFormControlLabel-label": { flex: 1 },
  };
}

/** Circular icon badge, identical geometry for every option in every state. */
function buildIconBadgeSx(tones: AccentTones): SxProps<Theme> {
  return {
    display: "grid",
    placeItems: "center",
    width: 40,
    height: 40,
    borderRadius: "50%",
    flexShrink: 0,
    // Translucent family tint stays distinct from the card surface in both
    // selected and unselected states (a container-toned badge would blend
    // into the card when dark-mode container tokens read as strong fills).
    backgroundColor: alpha(tones.main, 0.16),
    // The icon keeps the family accent at full opacity in both selected and
    // unselected cards — color is role decoration here, never a state hint.
    color: tones.main,
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
  readonly description: string;
  readonly selected: boolean;
}

function AdjustmentTypeOptionCard({ config, label, description, selected }: AdjustmentTypeOptionCardProps) {
  const theme = useTheme();
  const tones = ACCENT_TONES[config.accent](theme);
  return (
    <FormControlLabel
      value={config.value}
      control={<Radio sx={hiddenRadioSx} />}
      label={
        <Stack
          sx={{
            // Compact row on phones (badge left, label right); from `sm` the
            // desktop layout keeps the badge stacked above the label. The
            // group centers vertically so a wrapped sibling label doesn't
            // leave dead space at the bottom of the card.
            flexDirection: { xs: "row", sm: "column" },
            alignItems: { xs: "center", sm: "flex-start" },
            justifyContent: { sm: "center" },
            height: { sm: "100%" },
            gap: { xs: 1.5, sm: 1 },
          }}
        >
          <Stack aria-hidden sx={buildIconBadgeSx(tones)}>
            {config.icon}
          </Stack>
          <Stack sx={{ minWidth: 0, gap: 0.25 }}>
            <Typography
              sx={{
                fontWeight: 600,
                lineHeight: 1.3,
                color: selected ? tones.onContainer : theme.palette.onSurface,
              }}
            >
              {label}
            </Typography>
            <Typography
              sx={{
                fontSize: 12,
                lineHeight: 1.4,
                color: selected ? tones.onContainer : theme.palette.text.secondary,
                // One short guidance line per type; clamp so a long
                // translation can't unbalance the card row on narrow widths.
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
                overflow: "hidden",
              }}
            >
              {description}
            </Typography>
          </Stack>
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
/**
 * Neutral eyebrow color for the section heading. The per-preset
 * `onSurfaceVariant` and `text.secondary` tokens are tinted toward the preset
 * accent family (ocean renders them cyan), so the MUI `grey` ramp — the only
 * palette family presets never override — supplies the desaturated tone.
 */
function neutralSectionLabelColor(theme: Theme): string {
  return theme.palette.mode === "dark" ? theme.palette.grey[400] : theme.palette.grey[700];
}

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

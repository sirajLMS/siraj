"use client";

import { FormControlLabel, Radio, Stack, Typography, useTheme } from "@mui/material";
import { alpha, type SxProps, type Theme } from "@mui/material/styles";
import type { AdjustmentTypeOptionConfig } from "@/frontend/common/views/dashboard/accounting/credits/AdjustmentTypeRadioGroup.helpers";

/** Resolved family tones for a semantic accent (theme palette main + M3 onContainer text). */
interface AccentTones {
  readonly main: string;
  readonly onContainer: string;
}

const ACCENT_TONES: Record<AdjustmentTypeOptionConfig["accent"], (theme: Theme) => AccentTones> = {
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

interface AdjustmentTypeOptionCardProps {
  readonly config: AdjustmentTypeOptionConfig;
  readonly label: string;
  readonly description: string;
  readonly selected: boolean;
}

export function AdjustmentTypeOptionCard({ config, label, description, selected }: AdjustmentTypeOptionCardProps) {
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

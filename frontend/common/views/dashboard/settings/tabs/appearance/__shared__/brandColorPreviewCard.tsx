"use client";

import { Box, Stack, Typography } from "@mui/material";
import { BaseCard } from "@/frontend/common/components/ui";

interface BrandColorPreviewCardProps {
  readonly label: string;
  readonly primaryLabel: string;
  readonly secondaryLabel: string;
  readonly primary: string;
  readonly secondary: string;
}

/**
 * Visual swatch card showing the primary + secondary brand colors for one
 * color mode, with hex labels. Gives admins an at-a-glance reference of the
 * current draft palette without entering the full customize overlay.
 *
 * Swatch backgrounds use the raw hex values from the appearance draft
 * (user-selectable brand-color data, not theme tokens) — same exemption as
 * `PresetSwatch`. All chrome (border, radius, shadow, text colors) comes
 * from theme tokens via `sx` theme callbacks.
 */
export function BrandColorPreviewCard({
  label,
  primaryLabel,
  secondaryLabel,
  primary,
  secondary,
}: Readonly<BrandColorPreviewCardProps>) {
  return (
    <BaseCard sx={{ flex: 1 }}>
      <Typography
        sx={theme => ({
          typography: "labelUppercase",
          color: theme.palette.text.secondary,
          mb: 1.5,
        })}
      >
        {label}
      </Typography>
      <Stack direction="row" sx={{ gap: 2 }}>
        <BrandColorSwatch color={primary} colorLabel={primaryLabel} />
        <BrandColorSwatch color={secondary} colorLabel={secondaryLabel} />
      </Stack>
    </BaseCard>
  );
}

interface BrandColorSwatchProps {
  readonly color: string;
  readonly colorLabel: string;
}

function BrandColorSwatch({ color, colorLabel }: Readonly<BrandColorSwatchProps>) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
      <Box
        sx={theme => ({
          width: 48,
          height: 48,
          borderRadius: Number(theme.shape.borderRadius) * 2,
          backgroundColor: color,
          border: `2px solid ${theme.palette.outlineVariant}`,
          boxShadow: theme.palette.shadow.card,
        })}
      />
      <Typography
        sx={theme => ({
          typography: "caption",
          fontFamily: "monospace",
          color: theme.palette.text.secondary,
        })}
      >
        {color}
      </Typography>
      <Typography sx={theme => ({ typography: "labelSm", color: theme.palette.text.disabled })}>
        {colorLabel}
      </Typography>
    </Box>
  );
}

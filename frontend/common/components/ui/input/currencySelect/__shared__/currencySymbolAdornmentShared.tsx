"use client";

import type { SxProps, Theme } from "@mui/material";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import Typography from "@mui/material/Typography";

export interface CurrencySymbolAdornmentProps {
  readonly symbol: string;
  readonly variant?: "box" | "typography";
  readonly sx?: SxProps<Theme>;
}

const BOX_ADORNMENT_SX: SxProps<Theme> = (theme: Theme) => ({
  fontWeight: "bold",
  color: theme.palette.primary.main,
  opacity: 0.6,
});

const TYPOGRAPHY_ADORNMENT_SX: SxProps<Theme> = (theme: Theme) => ({
  fontWeight: 700,
  color: theme.palette.onSurfaceVariant,
});

export function CurrencySymbolAdornment({ symbol, variant = "box", sx }: Readonly<CurrencySymbolAdornmentProps>) {
  return (
    <InputAdornment position="start">
      {variant === "box" ? (
        <Box component="span" sx={sx ?? BOX_ADORNMENT_SX}>
          {symbol}
        </Box>
      ) : (
        <Typography variant="bodyMd" sx={sx ?? TYPOGRAPHY_ADORNMENT_SX}>
          {symbol}
        </Typography>
      )}
    </InputAdornment>
  );
}

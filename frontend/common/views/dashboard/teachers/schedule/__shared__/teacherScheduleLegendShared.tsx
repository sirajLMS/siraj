"use client";

import { Box, type Theme, Typography } from "@mui/material";

export type ScheduleLegendSwatchSpec =
  | { readonly kind: "dot"; readonly color: (theme: Theme) => string }
  | { readonly kind: "filled"; readonly color: (theme: Theme) => string }
  | { readonly kind: "outlined" };

interface ScheduleLegendItem {
  readonly key: string;
  readonly label: string;
  readonly swatch: ScheduleLegendSwatchSpec;
}

export interface ScheduleLegendProps {
  readonly items: readonly ScheduleLegendItem[];
  readonly labelVariant?: "labelMd" | "labelUppercase";
  readonly spacing?: number;
}

const DOT_SIZE = 8;
const TILE_SIZE = 12;

function buildSwatchStyle(swatch: ScheduleLegendSwatchSpec): (theme: Theme) => object {
  return theme => {
    const base = { flexShrink: 0 } as const;
    if (swatch.kind === "dot") {
      return {
        ...base,
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: "50%",
        backgroundColor: swatch.color(theme),
      };
    }
    if (swatch.kind === "filled") {
      return {
        ...base,
        width: TILE_SIZE,
        height: TILE_SIZE,
        borderRadius: 0.5,
        backgroundColor: swatch.color(theme),
      };
    }
    return {
      ...base,
      width: TILE_SIZE,
      height: TILE_SIZE,
      borderRadius: 0.5,
      border: `1px solid ${theme.palette.border.light}`,
    };
  };
}

export function ScheduleLegend({ items, labelVariant = "labelMd", spacing = 2 }: Readonly<ScheduleLegendProps>) {
  return (
    <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: spacing }}>
      {items.map(item => (
        <Box key={item.key} sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1 }}>
          <Box sx={buildSwatchStyle(item.swatch)} />
          <Typography variant={labelVariant} sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {item.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

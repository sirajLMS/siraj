"use client";

import { Box, Typography } from "@mui/material";
import type { BookItemBadgeProps } from "@/frontend/common/views/dashboard/resources/books-and-bags/types/bookItemBadgeShared.types";

function isStatusPaletteKey(status: Record<string, string>, key: string): boolean {
  return key in status;
}

function getStatusPaletteColor(status: Record<string, string>, key: string): string | undefined {
  return isStatusPaletteKey(status, key) ? status[key] : undefined;
}

function getOnContainerKey(paletteKey: string): string {
  return `on${paletteKey.charAt(0).toUpperCase()}${paletteKey.slice(1)}Container`;
}

/**
 * BookItemStatusBadge — the inline status pill shared between the desktop
 * (`Paper`) and mobile (`MobileCardListItem`) BookItemCard variants. Lifted
 * out of the tier files to satisfy the SonarQube duplication cluster flagged on
 * the byte-identical `<Box component="span">` with the `paletteKey`-derived
 * `containerKey` / `onContainerKey` lookup on `theme.palette.status`.
 */
export function BookItemStatusBadge({ statusLabel, paletteKey }: Readonly<BookItemBadgeProps>) {
  return (
    <Box
      component="span"
      sx={theme => {
        const status = theme.palette.status as Record<string, string>;
        const containerKey = `${paletteKey}Container`;
        const onContainerKey = getOnContainerKey(paletteKey);
        return {
          display: "inline-flex",
          alignItems: "center",
          px: 1.5,
          py: 0.5,
          borderRadius: theme.layout.radius.badge,
          backgroundColor: getStatusPaletteColor(status, containerKey),
          color: getStatusPaletteColor(status, onContainerKey),
          alignSelf: "flex-start",
        };
      }}
    >
      <Typography variant="labelUppercase" sx={{ lineHeight: 1 }}>
        {statusLabel}
      </Typography>
    </Box>
  );
}

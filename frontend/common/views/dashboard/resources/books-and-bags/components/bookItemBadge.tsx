"use client";

import { Box, Typography } from "@mui/material";
import type { BookItemBadgeProps } from "@/frontend/common/views/dashboard/resources/books-and-bags/types/bookItemBadgeShared.types";

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
        const containerKey = `${paletteKey}Container` as keyof typeof theme.palette.status;
        const onContainerKey =
          `on${paletteKey.charAt(0).toUpperCase()}${paletteKey.slice(1)}Container` as keyof typeof theme.palette.status;
        return {
          display: "inline-flex",
          alignItems: "center",
          px: 1.5,
          py: 0.5,
          borderRadius: theme.layout.radius.badge,
          backgroundColor: theme.palette.status[containerKey],
          color: theme.palette.status[onContainerKey],
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

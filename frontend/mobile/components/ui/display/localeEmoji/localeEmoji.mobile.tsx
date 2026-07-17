"use client";

import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import type * as React from "react";

export type MobileLocaleEmojiProps = {
  readonly emoji: string;
  readonly sx?: SxProps<Theme>;
};

/**
 * Mobile-tier emoji span for inline locale display (flags, language icons).
 * Self-contained — no shared base. Tighter `lineHeight` (1.1) than desktop
 * for compact mobile rows.
 */
export const MobileLocaleEmoji: React.FC<MobileLocaleEmojiProps> = ({ emoji, sx }): React.ReactNode => {
  return (
    <Box component="span" aria-hidden sx={{ flexShrink: 0, lineHeight: 1.1, ...sx }}>
      {emoji}
    </Box>
  );
};

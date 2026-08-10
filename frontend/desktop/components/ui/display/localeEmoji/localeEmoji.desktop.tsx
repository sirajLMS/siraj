"use client";

import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import type * as React from "react";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";

export type DesktopLocaleEmojiProps = {
  readonly emoji: string;
  readonly sx?: SxProps<Theme>;
};

/**
 * Desktop-tier emoji span for inline locale display (flags, language icons).
 * Self-contained — no shared base.
 */
export const DesktopLocaleEmoji: React.FC<DesktopLocaleEmojiProps> = ({ emoji, sx }): React.ReactNode => {
  return (
    <Box component="span" aria-hidden sx={mergeSx({ flexShrink: 0, lineHeight: 1 }, sx)}>
      {emoji}
    </Box>
  );
};

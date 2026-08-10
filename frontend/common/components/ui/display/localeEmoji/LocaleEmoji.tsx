"use client";

import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import type * as React from "react";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";

export type LocaleEmojiProps = {
  readonly emoji: string;
  readonly sx?: SxProps<Theme>;
};

/**
 * Shared emoji span for inline locale display (flags, language icons).
 */
export const LocaleEmoji: React.FC<LocaleEmojiProps> = ({ emoji, sx }): React.ReactNode => {
  return (
    <Box component="span" aria-hidden sx={mergeSx({ flexShrink: 0, lineHeight: 1 }, sx)}>
      {emoji}
    </Box>
  );
};

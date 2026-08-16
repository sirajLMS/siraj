"use client";

import { Box, Fade, Grow } from "@mui/material";
import type { ReactNode } from "react";

export function NumbersListItemTransition({
  visible,
  enterTimeout,
  deleteTimeout,
  ariaBusy,
  children,
}: Readonly<{
  readonly visible: boolean;
  readonly enterTimeout: number;
  readonly deleteTimeout: number;
  readonly ariaBusy: boolean;
  readonly children: ReactNode;
}>) {
  return (
    <Fade in={visible} timeout={{ enter: enterTimeout, exit: deleteTimeout }}>
      <Grow in={visible} timeout={{ enter: enterTimeout, exit: deleteTimeout }}>
        <Box sx={{ position: "relative" }} aria-busy={ariaBusy}>
          {children}
        </Box>
      </Grow>
    </Fade>
  );
}

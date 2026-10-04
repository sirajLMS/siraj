"use client";

import { ArrowBackOutlined } from "@mui/icons-material";
import { IconButton, Stack } from "@mui/material";
import type { ReactNode } from "react";

/**
 * Bordered chrome shared by WhatsApp chat-thread panes: the outer rounded
 * stack, and a header row with an optional back button (mobile single-pane
 * flow, mirrored in RTL) followed by the caller's title block. The message
 * surface and any footer/composer dock below via `children`.
 */
export function ThreadPaneFrame({
  backLabel,
  onBack,
  header,
  children,
}: Readonly<{
  backLabel: string;
  onBack?: () => void;
  header: ReactNode;
  children: ReactNode;
}>) {
  return (
    <Stack sx={{ borderRadius: 2, overflow: "hidden", border: theme => `1px solid ${theme.palette.outlineVariant}` }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ p: 2, alignItems: "center", borderBottom: theme => `1px solid ${theme.palette.outlineVariant}` }}
      >
        {onBack && (
          <IconButton onClick={onBack} aria-label={backLabel} size="small">
            <ArrowBackOutlined sx={theme => ({ transform: theme.direction === "rtl" ? "scaleX(-1)" : "scaleX(1)" })} />
          </IconButton>
        )}
        {header}
      </Stack>
      {children}
    </Stack>
  );
}

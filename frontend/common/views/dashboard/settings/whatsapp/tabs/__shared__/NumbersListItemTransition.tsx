"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import {
  ROW_DELETE_DURATION,
  ROW_ENTER_DURATION,
} from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/whatsappAnimations";

/**
 * Row enter/exit animation for the WhatsApp numbers list. Motion is gated behind
 * `prefers-reduced-motion: no-preference`, so reduced-motion users see rows appear
 * and disappear instantly while everyone else gets the fade/grow transition.
 */
export function NumbersListItemTransition({
  visible,
  ariaBusy,
  children,
}: Readonly<{
  readonly visible: boolean;
  readonly ariaBusy: boolean;
  readonly children: ReactNode;
}>) {
  return (
    <Box
      aria-busy={ariaBusy}
      sx={{
        position: "relative",
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "scale(0.95)",
        "@media (prefers-reduced-motion: no-preference)": {
          animation: `numbersListItemEnter ${ROW_ENTER_DURATION}ms ease-out`,
          transition: `opacity ${ROW_DELETE_DURATION}ms ease, transform ${ROW_DELETE_DURATION}ms ease`,
        },
        "@keyframes numbersListItemEnter": {
          from: { opacity: 0, transform: "scale(0.95)" },
          to: { opacity: 1, transform: "scale(1)" },
        },
      }}
    >
      {children}
    </Box>
  );
}

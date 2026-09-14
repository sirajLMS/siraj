"use client";

import { Paper, Stack } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";

interface FilterBarShellSharedProps {
  /** Filter controls rendered as direct children of the wrap-toggle stack. */
  readonly content: ReactNode;
  /** Optional trailing actions node (clear control, include toggles). */
  readonly actions?: ReactNode;
  /** Overrides merged into the outlined Paper shell (tier-specific padding tweaks). */
  readonly paperSx?: SxProps<Theme>;
  /** Overrides merged into the filter stack (tier-specific gap or alignment tweaks). */
  readonly stackSx?: SxProps<Theme>;
}

const PAPER_SX: SxProps<Theme> = { p: 2, width: "100%" };

const STACK_SX: SxProps<Theme> = {
  flexWrap: "wrap",
  gap: 2,
  alignItems: { xs: "stretch", md: "center" },
};

/**
 * Outlined Paper + wrap-toggle stack shell behind the accounting filter bars.
 * Filter controls arrive through the `content` slot as direct stack children so
 * the responsive wrap layout positions them, and the optional `actions` slot
 * trails the content. The shell is viewport-agnostic: both viewport tiers
 * consume it with their own slot overrides, no media queries involved.
 */
export function FilterBarShellShared({ content, actions, paperSx, stackSx }: Readonly<FilterBarShellSharedProps>) {
  return (
    <Paper variant="outlined" sx={mergeSx(PAPER_SX, paperSx)}>
      <Stack direction={{ xs: "column", md: "row" }} sx={mergeSx(STACK_SX, stackSx)}>
        {content}
        {actions ?? null}
      </Stack>
    </Paper>
  );
}

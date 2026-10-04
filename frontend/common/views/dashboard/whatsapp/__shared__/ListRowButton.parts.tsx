"use client";

import { ButtonBase } from "@mui/material";
import type { ReactNode } from "react";

/**
 * Pressable list-row shell shared by the WhatsApp conversations and groups
 * list rows: full-width button with start-aligned flex layout, selection
 * highlight, and hover/focus-visible feedback.
 */
export function ListRowButton({
  selected,
  onClick,
  children,
}: Readonly<{ selected: boolean; onClick: () => void; children: ReactNode }>) {
  return (
    <ButtonBase
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      sx={theme => ({
        display: "flex",
        gap: 1.5,
        width: "100%",
        boxSizing: "border-box",
        px: 2,
        py: 1.5,
        alignItems: "center",
        textAlign: "start",
        backgroundColor: selected ? theme.palette.action.selected : "transparent",
        borderRadius: 1,
        "&:hover": { backgroundColor: theme.palette.action.hover },
        "&:focus-visible": { backgroundColor: theme.palette.action.hover },
      })}
    >
      {children}
    </ButtonBase>
  );
}

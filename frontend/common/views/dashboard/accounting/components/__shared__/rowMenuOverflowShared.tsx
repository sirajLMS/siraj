"use client";

import { Box, Menu, MenuItem } from "@mui/material";
import type { ReactNode } from "react";

export interface RowMenuOverflowItem {
  readonly key: string;
  readonly icon: ReactNode;
  readonly label: string;
  readonly run: () => void;
  readonly disabled?: boolean;
  readonly danger?: boolean;
}

interface RowMenuOverflowProps {
  readonly items: readonly RowMenuOverflowItem[];
  /** Prefix for the per-card menu id (`${idPrefix}-${rowId}`). */
  readonly idPrefix: string;
  readonly rowId: string;
  readonly anchorEl: HTMLElement | null;
  readonly onClose: () => void;
}

/** Overflow menu shell rendering the per-card row action entries. */
export function RowMenuOverflow({ items, idPrefix, rowId, anchorEl, onClose }: Readonly<RowMenuOverflowProps>) {
  const menuOpen = anchorEl !== null;
  return (
    <Menu id={`${idPrefix}-${rowId}`} anchorEl={anchorEl} open={menuOpen} onClose={onClose}>
      {items.map(item => (
        <MenuItem
          key={item.key}
          disabled={item.disabled ?? false}
          onClick={() => {
            onClose();
            item.run();
          }}
          sx={item.danger === true ? theme => ({ color: theme.palette.error.main }) : undefined}
        >
          <Box component="span" sx={{ marginInlineEnd: 1, display: "inline-flex" }}>
            {item.icon}
          </Box>
          {item.label}
        </MenuItem>
      ))}
    </Menu>
  );
}

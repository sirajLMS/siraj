"use client";

import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import EventNoteOutlined from "@mui/icons-material/EventNoteOutlined";
import MoreVertOutlined from "@mui/icons-material/MoreVertOutlined";
import UndoOutlined from "@mui/icons-material/UndoOutlined";
import { IconButton, Menu, MenuItem } from "@mui/material";
import { useState } from "react";
import type { CarryoverRow } from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverViewModel";
import type { CarryoverLabels } from "@/shared/locale/types/dashboard/accounting/carryover";

interface CarryoverRowActionsMenuProps {
  readonly row: CarryoverRow;
  readonly labels: CarryoverLabels;
  readonly actionsColumnLabel: string;
  /** Manager-only items (Edit / Unpay / Delete) are hidden when false; View Sessions stays. */
  readonly canManageCarryover: boolean;
  readonly onOpenForm: (row: CarryoverRow) => void;
  readonly onOpenDelete: (rows: readonly CarryoverRow[]) => void;
  readonly onOpenUnpay: (row: CarryoverRow) => void;
  readonly onOpenDrawer: (row: CarryoverRow) => void;
}

/**
 * Per-row "more" menu: View Sessions is a read affordance available to every
 * viewer; Edit / Unpay / Delete are manager-only (Unpay only while the row is
 * settled, Delete disabled for settled rows — paid carryovers must be unpaid
 * before they can be removed). Owns purely local anchor state.
 */
export function CarryoverRowActionsMenu({
  row,
  labels,
  actionsColumnLabel,
  canManageCarryover,
  onOpenForm,
  onOpenDelete,
  onOpenUnpay,
  onOpenDrawer,
}: Readonly<CarryoverRowActionsMenuProps>) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = anchorEl !== null;
  const rowId = row.id ?? "";
  const closeMenu = () => setAnchorEl(null);

  const runAction = (action: () => void) => {
    closeMenu();
    action();
  };

  return (
    <>
      <IconButton
        id={`carryover-row-actions-${rowId}`}
        size="small"
        onClick={event => setAnchorEl(event.currentTarget)}
        aria-label={actionsColumnLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `carryover-row-menu-${rowId}` : undefined}
      >
        <MoreVertOutlined fontSize="small" />
      </IconButton>
      <Menu id={`carryover-row-menu-${rowId}`} anchorEl={anchorEl} open={open} onClose={closeMenu}>
        {canManageCarryover ? (
          <MenuItem onClick={() => runAction(() => onOpenForm(row))}>
            <EditOutlined fontSize="small" sx={{ marginInlineEnd: 1 }} />
            {labels.action.edit}
          </MenuItem>
        ) : null}
        <MenuItem onClick={() => runAction(() => onOpenDrawer(row))}>
          <EventNoteOutlined fontSize="small" sx={{ marginInlineEnd: 1 }} />
          {labels.action.viewSessions}
        </MenuItem>
        {canManageCarryover && row.isPaid === true ? (
          <MenuItem onClick={() => runAction(() => onOpenUnpay(row))}>
            <UndoOutlined fontSize="small" sx={{ marginInlineEnd: 1 }} />
            {labels.action.unpay}
          </MenuItem>
        ) : null}
        {canManageCarryover ? (
          <MenuItem
            onClick={() => runAction(() => onOpenDelete([row]))}
            disabled={row.isPaid === true}
            sx={theme => ({ color: row.isPaid === true ? theme.palette.text.disabled : theme.palette.error.main })}
          >
            <DeleteOutlined fontSize="small" sx={{ marginInlineEnd: 1 }} />
            {labels.action.delete}
          </MenuItem>
        ) : null}
      </Menu>
    </>
  );
}

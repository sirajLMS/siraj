"use client";

import { DeleteOutlined, EditOutlined, EventNoteOutlined, MoreVertOutlined, UndoOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { useState } from "react";
import type { CarryoverRow } from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverViewModel";
import {
  RowMenuOverflow,
  type RowMenuOverflowItem,
} from "@/frontend/common/views/dashboard/accounting/components/__shared__/rowMenuOverflowShared";
import type { CarryoverLabels } from "@/shared/locale/types/dashboard/accounting/carryover";

export interface CarryoverRowMenuProps {
  readonly row: CarryoverRow;
  readonly labels: CarryoverLabels;
  readonly actionsMenuLabel: string;
  /** Manager-only items (Edit / Unpay / Delete) are omitted when false; View Sessions stays. */
  readonly canManage: boolean;
  readonly onOpenForm: (row: CarryoverRow) => void;
  readonly onOpenDelete: (rows: readonly CarryoverRow[]) => void;
  readonly onOpenUnpay: (row: CarryoverRow) => void;
  readonly onOpenDrawer: (row: CarryoverRow) => void;
}

type CarryoverRowMenuArgs = Omit<CarryoverRowMenuProps, "actionsMenuLabel">;

/** Builds the overflow menu entries; the write actions sit behind the manage gate while View Sessions stays a plain read affordance. */
function buildRowMenuItems(args: CarryoverRowMenuArgs): RowMenuOverflowItem[] {
  const { row, labels, canManage, onOpenForm, onOpenDelete, onOpenUnpay, onOpenDrawer } = args;
  const paid = row.isPaid === true;
  const items: RowMenuOverflowItem[] = [
    {
      key: "sessions",
      icon: <EventNoteOutlined fontSize="small" />,
      label: labels.action.viewSessions,
      run: () => onOpenDrawer(row),
    },
  ];
  if (!canManage) return items;
  items.unshift({
    key: "edit",
    icon: <EditOutlined fontSize="small" />,
    label: labels.action.edit,
    run: () => onOpenForm(row),
  });
  if (paid) {
    items.push({
      key: "unpay",
      icon: <UndoOutlined fontSize="small" />,
      label: labels.action.unpay,
      run: () => onOpenUnpay(row),
    });
  }
  items.push({
    key: "delete",
    icon: <DeleteOutlined fontSize="small" />,
    label: labels.action.delete,
    run: () => onOpenDelete([row]),
    disabled: paid,
    danger: true,
  });
  return items;
}

/** Per-card overflow menu holding the row actions in the compact mobile layout. */
export function CarryoverRowMenu(props: Readonly<CarryoverRowMenuProps>) {
  const { row, actionsMenuLabel } = props;
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const menuOpen = anchorEl !== null;
  const items = buildRowMenuItems(props);
  const rowId = row.id ?? "";

  return (
    <>
      <IconButton
        size="small"
        onClick={event => setAnchorEl(event.currentTarget)}
        aria-label={actionsMenuLabel}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-controls={menuOpen ? `carryover-card-menu-${rowId}` : undefined}
      >
        <MoreVertOutlined fontSize="small" />
      </IconButton>
      <RowMenuOverflow
        items={items}
        idPrefix="carryover-card-menu"
        rowId={rowId}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
      />
    </>
  );
}

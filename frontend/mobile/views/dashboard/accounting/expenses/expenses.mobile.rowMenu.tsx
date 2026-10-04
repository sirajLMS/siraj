"use client";

import { DeleteOutlined, EditOutlined, LinkOutlined, MoreVertOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { useState } from "react";
import {
  RowMenuOverflow,
  type RowMenuOverflowItem,
} from "@/frontend/common/views/dashboard/accounting/components/__shared__/rowMenuOverflowShared";
import type { ExpenseRow } from "@/frontend/common/views/dashboard/accounting/expenses/useExpensesViewModel";
import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";

export interface ExpenseRowMenuProps {
  readonly row: ExpenseRow;
  readonly labels: ExpensesLabels;
  readonly menuAriaLabel: string;
  /** Manager-only items (Edit / Delete) are omitted when false; View Source stays. */
  readonly canManage: boolean;
  readonly onOpenForm: (row: ExpenseRow) => void;
  readonly onOpenDelete: (rows: readonly ExpenseRow[]) => void;
  readonly onViewSource: (sourceEntityId: string) => void;
}

/** Builds the overflow menu entries; write actions sit behind the manage gate while View Source stays a read affordance. */
function buildRowMenuItems(args: Omit<ExpenseRowMenuProps, "menuAriaLabel">): RowMenuOverflowItem[] {
  const { row, labels, canManage, onOpenForm, onOpenDelete, onViewSource } = args;
  const deleted = row.deletedAt !== null;
  const items: RowMenuOverflowItem[] = [
    {
      key: "viewSource",
      icon: <LinkOutlined fontSize="small" />,
      label: labels.action.viewSource,
      run: () => {
        const sourceId = row.sourceEntityId;
        if (sourceId !== null) onViewSource(sourceId);
      },
      disabled: row.sourceEntityId === null,
    },
  ];
  if (!canManage) return items;
  items.unshift({
    key: "edit",
    icon: <EditOutlined fontSize="small" />,
    label: labels.action.edit,
    run: () => onOpenForm(row),
    disabled: deleted,
  });
  items.push({
    key: "delete",
    icon: <DeleteOutlined fontSize="small" />,
    label: labels.action.delete,
    run: () => onOpenDelete([row]),
    disabled: deleted,
    danger: true,
  });
  return items;
}

/** Per-card overflow menu holding the row actions in the compact mobile layout. */
export function ExpenseRowMenu(props: Readonly<ExpenseRowMenuProps>) {
  const { row, menuAriaLabel } = props;
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const menuOpen = anchorEl !== null;
  const items = buildRowMenuItems(props);
  const rowId = row.id ?? "";

  return (
    <>
      <IconButton
        size="small"
        onClick={event => setAnchorEl(event.currentTarget)}
        aria-label={menuAriaLabel}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-controls={menuOpen ? `expense-card-menu-${rowId}` : undefined}
      >
        <MoreVertOutlined fontSize="small" />
      </IconButton>
      <RowMenuOverflow
        items={items}
        idPrefix="expense-card-menu"
        rowId={rowId}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
      />
    </>
  );
}

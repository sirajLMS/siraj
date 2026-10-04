"use client";

import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import LinkOutlined from "@mui/icons-material/LinkOutlined";
import MoreVertOutlined from "@mui/icons-material/MoreVertOutlined";
import { IconButton, Menu, MenuItem } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { useState } from "react";
import type { ExpenseRow } from "@/frontend/common/views/dashboard/accounting/expenses/useExpensesViewModel";
import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";

interface ExpenseRowActionsMenuProps {
  readonly row: ExpenseRow;
  readonly labels: ExpensesLabels;
  /** Manager-only items (Edit / Delete) are hidden when false; View Source stays. */
  readonly canManageExpenses: boolean;
  readonly onOpenForm: (row: ExpenseRow) => void;
  readonly onOpenDelete: (rows: readonly ExpenseRow[]) => void;
  readonly onViewSource: (sourceEntityId: string) => void;
}

/**
 * Per-row "more" menu: View Source is a read affordance available to every
 * viewer (enabled only when the row carries a linked source entity); Edit and
 * Delete are manager-only and disabled on soft-deleted rows, which must first
 * be handled through the delete/restore accounting flow. Owns purely local
 * anchor state.
 */
export function ExpenseRowActionsMenu({
  row,
  labels,
  canManageExpenses,
  onOpenForm,
  onOpenDelete,
  onViewSource,
}: Readonly<ExpenseRowActionsMenuProps>) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = anchorEl !== null;
  const rowId = row.id ?? "";
  const deleted = row.deletedAt !== null;
  const closeMenu = () => setAnchorEl(null);

  const runAction = (action: () => void) => {
    closeMenu();
    action();
  };

  const openSource = () => {
    const sourceId = row.sourceEntityId;
    if (sourceId === null) return;
    runAction(() => onViewSource(sourceId));
  };

  return (
    <>
      <IconButton
        id={`expenses-row-actions-${rowId}`}
        size="small"
        onClick={event => setAnchorEl(event.currentTarget)}
        aria-label={labels.column.rowActions(row.title ?? "")}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `expenses-row-menu-${rowId}` : undefined}
      >
        <MoreVertOutlined fontSize="small" />
      </IconButton>
      <Menu id={`expenses-row-menu-${rowId}`} anchorEl={anchorEl} open={open} onClose={closeMenu}>
        {canManageExpenses ? (
          <MenuItem onClick={() => runAction(() => onOpenForm(row))} disabled={deleted}>
            <EditOutlined fontSize="small" sx={{ marginInlineEnd: 1 }} />
            {labels.action.edit}
          </MenuItem>
        ) : null}
        {canManageExpenses ? (
          <MenuItem
            onClick={() => runAction(() => onOpenDelete([row]))}
            disabled={deleted}
            sx={(theme: Theme) => ({ color: theme.palette.error.main })}
          >
            <DeleteOutlined fontSize="small" sx={{ marginInlineEnd: 1 }} />
            {labels.action.delete}
          </MenuItem>
        ) : null}
        <MenuItem onClick={openSource} disabled={row.sourceEntityId === null}>
          <LinkOutlined fontSize="small" sx={{ marginInlineEnd: 1 }} />
          {labels.action.viewSource}
        </MenuItem>
      </Menu>
    </>
  );
}

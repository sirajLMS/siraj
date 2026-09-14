"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { BulkDeleteExpensesDialog } from "@/frontend/common/views/dashboard/accounting/expenses/BulkDeleteExpensesDialog";
import { DeleteExpenseDialog } from "@/frontend/common/views/dashboard/accounting/expenses/DeleteExpenseDialog";
import { ExpenseDetailDrawer } from "@/frontend/common/views/dashboard/accounting/expenses/ExpenseDetailDrawer";
import { ExpenseFormDialog } from "@/frontend/common/views/dashboard/accounting/expenses/ExpenseFormDialog";
import type { ExpensesDialogCallbacks } from "@/frontend/common/views/dashboard/accounting/expenses/ExpensesDataGrid";
import {
  type ExpenseRow,
  type ExpensesViewModel,
  useExpensesViewModel,
} from "@/frontend/common/views/dashboard/accounting/expenses/useExpensesViewModel";

/** Deep-link route that opens the linked carryover balance's detail drawer. */
const carryoverSourceHref = (sourceEntityId: string): string => `/accounting/carryover/${sourceEntityId}`;

/** At most one overlay (form, delete confirmation, or drawer) is open at a time. */
type ExpensesOverlayTarget =
  | { readonly kind: "none" }
  | { readonly kind: "form"; readonly row: ExpenseRow | null }
  | { readonly kind: "delete"; readonly rows: readonly ExpenseRow[] }
  | { readonly kind: "drawer"; readonly id: string };

const NO_TARGET: ExpensesOverlayTarget = { kind: "none" };
const EMPTY_ROWS: readonly ExpenseRow[] = [];

/** Opens the expense detail drawer for a list row; a missing id never opens anything. */
type OpenExpenseDrawer = (row: ExpenseRow) => void;

/** Props served to both responsive tier views: the full view model plus the lifted overlay openers. */
export type ExpensesViewProps = ExpensesViewModel &
  ExpensesDialogCallbacks & {
    readonly onOpenDrawer: OpenExpenseDrawer;
  };

const lazyViews = createLazyView<ExpensesViewProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/accounting/expenses/expenses.mobile").then(m => ({
      default: m.ExpensesMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/accounting/expenses/expenses.desktop").then(m => ({
      default: m.ExpensesDesktopView,
    }))
);

/** Owns the overlay open targets; row snapshots captured at open time survive until close. */
function useExpensesOverlayState(viewModel: ExpensesViewModel) {
  const router = useRouter();
  const { clearSelection } = viewModel;
  const [target, setTarget] = useState<ExpensesOverlayTarget>(NO_TARGET);
  const closeOverlay = useCallback(() => setTarget(NO_TARGET), []);
  // Selection is page-local (page turns clear it), so a finished delete drops it
  // to keep a deleted id from leaking into the next bulk payload. The form dialog
  // is excluded — its own cache eviction refetches, and a saved row stays valid.
  const afterWrite = useCallback(() => {
    clearSelection();
  }, [clearSelection]);
  const callbacks = useMemo<ExpensesDialogCallbacks & { onOpenDrawer: OpenExpenseDrawer }>(
    () => ({
      onOpenForm: row => setTarget({ kind: "form", row }),
      onOpenDelete: (rowsToDelete: readonly ExpenseRow[]) => setTarget({ kind: "delete", rows: rowsToDelete }),
      onViewSource: (sourceEntityId: string) => {
        router.push(carryoverSourceHref(sourceEntityId));
      },
      onOpenDrawer: row => {
        if (row.id !== null) {
          setTarget({ kind: "drawer", id: row.id });
        }
      },
    }),
    [router]
  );
  return { target, closeOverlay, afterWrite, callbacks };
}

/**
 * Composition root of the expense ledger page: builds the shared view model,
 * hands it to the responsive tier view, and renders the tier-neutral dialogs
 * and detail drawer once, above whichever tier is active. Deleting a single row
 * goes through DeleteExpenseDialog; two or more through BulkDeleteExpensesDialog.
 */
export function ExpensesContainer() {
  const viewModel = useExpensesViewModel();
  const { target, closeOverlay, afterWrite, callbacks } = useExpensesOverlayState(viewModel);

  const formRow = target.kind === "form" ? target.row : null;
  const deleteRows = target.kind === "delete" ? target.rows : EMPTY_ROWS;
  const singleDeleteRow = deleteRows.length === 1 ? (deleteRows[0] ?? null) : null;
  const drawerId = target.kind === "drawer" ? target.id : "";

  return (
    <>
      <ResponsiveViewSwitch
        mobile={lazyViews.mobile}
        desktop={lazyViews.desktop}
        props={{ ...viewModel, ...callbacks }}
      />
      <ExpenseFormDialog open={target.kind === "form"} row={formRow} onClose={closeOverlay} />
      <DeleteExpenseDialog
        open={singleDeleteRow !== null}
        row={singleDeleteRow}
        onClose={closeOverlay}
        onDone={afterWrite}
      />
      <BulkDeleteExpensesDialog
        open={deleteRows.length > 1}
        rows={deleteRows}
        onClose={closeOverlay}
        onDone={afterWrite}
      />
      <ExpenseDetailDrawer expenseId={drawerId} open={target.kind === "drawer"} onClose={closeOverlay} />
    </>
  );
}

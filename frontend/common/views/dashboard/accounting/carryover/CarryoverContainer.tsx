"use client";

import { useCallback, useMemo, useState } from "react";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { BulkDeleteCarryoverDialog } from "@/frontend/common/views/dashboard/accounting/carryover/BulkDeleteCarryoverDialog";
import { BulkToExpenseModal } from "@/frontend/common/views/dashboard/accounting/carryover/BulkToExpenseModal";
import type { CarryoverDialogCallbacks } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverDataGrid";
import { CarryoverDetailDrawer } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverDetailDrawer";
import { CarryoverFormDialog } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverFormDialog";
import { DeleteCarryoverDialog } from "@/frontend/common/views/dashboard/accounting/carryover/DeleteCarryoverDialog";
import { UnpayCarryoverDialog } from "@/frontend/common/views/dashboard/accounting/carryover/UnpayCarryoverDialog";
import {
  type CarryoverRow,
  type CarryoverViewModel,
  useCarryoverViewModel,
} from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverViewModel";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingPayments } from "@/shared/locale/namespaces";

/** At most one overlay (form, bulk action, confirmation, drawer) is open at a time. */
type CarryoverOverlayTarget =
  | { readonly kind: "none" }
  | { readonly kind: "form"; readonly row: CarryoverRow | null }
  | { readonly kind: "bulk-to-expense" }
  | { readonly kind: "delete"; readonly rows: readonly CarryoverRow[] }
  | { readonly kind: "unpay"; readonly row: CarryoverRow }
  | { readonly kind: "drawer"; readonly id: string };

const NO_TARGET: CarryoverOverlayTarget = { kind: "none" };
const EMPTY_ROWS: readonly CarryoverRow[] = [];

/** Props served to both responsive tier views: the full view model plus the lifted dialog openers. */
export type CarryoverViewProps = CarryoverViewModel &
  CarryoverDialogCallbacks & {
    /** Accessible label for each row's overflow menu button. */
    readonly actionsMenuLabel: string;
  };

const lazyViews = createLazyView<CarryoverViewProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/accounting/carryover/carryover.mobile").then(m => ({
      default: m.CarryoverMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/accounting/carryover/carryover.desktop").then(m => ({
      default: m.CarryoverDesktopView,
    }))
);

/** Owns overlay open targets plus the row resolution bulk dialogs need from the visible page. */
function useCarryoverOverlayState(viewModel: CarryoverViewModel) {
  const { clearSelection } = viewModel;
  const [target, setTarget] = useState<CarryoverOverlayTarget>(NO_TARGET);
  const closeOverlay = useCallback(() => setTarget(NO_TARGET), []);
  // Selection is page-local (page turns clear it), so a finished write drops it
  // to keep a deleted/converted id from leaking into the next bulk payload.
  const afterWrite = useCallback(() => {
    clearSelection();
  }, [clearSelection]);
  const selectedRows = useMemo(
    () => viewModel.rows.filter(row => row.id !== null && viewModel.selectedIds.includes(row.id)),
    [viewModel.rows, viewModel.selectedIds]
  );
  const callbacks = useMemo<CarryoverDialogCallbacks>(
    () => ({
      onOpenForm: row => setTarget({ kind: "form", row }),
      onOpenBulkToExpense: () => setTarget({ kind: "bulk-to-expense" }),
      onOpenDelete: (rowsToDelete: readonly CarryoverRow[]) => setTarget({ kind: "delete", rows: rowsToDelete }),
      onOpenUnpay: (row: CarryoverRow) => setTarget({ kind: "unpay", row }),
      onOpenDrawer: (row: CarryoverRow) => {
        if (row.id !== null) {
          setTarget({ kind: "drawer", id: row.id });
        }
      },
    }),
    []
  );
  return { target, closeOverlay, selectedRows, afterWrite, callbacks };
}

/**
 * Composition root of the carryover balance page: builds the shared view model,
 * hands it to the responsive tier view, and renders the tier-neutral dialogs
 * and detail drawer once, above whichever tier is active.
 */
export function CarryoverContainer() {
  const viewModel = useCarryoverViewModel();
  const paymentsLabels = useAppTranslation(DashboardAccountingPayments);
  const { target, closeOverlay, selectedRows, afterWrite, callbacks } = useCarryoverOverlayState(viewModel);

  const formRow = target.kind === "form" ? target.row : null;
  const deleteRows = target.kind === "delete" ? target.rows : EMPTY_ROWS;
  const singleDeleteRow = deleteRows.length === 1 ? (deleteRows[0] ?? null) : null;
  const unpayRow = target.kind === "unpay" ? target.row : null;
  const drawerId = target.kind === "drawer" ? target.id : "";

  return (
    <>
      <ResponsiveViewSwitch
        mobile={lazyViews.mobile}
        desktop={lazyViews.desktop}
        props={{ ...viewModel, ...callbacks, actionsMenuLabel: paymentsLabels.columns.actions }}
      />
      <CarryoverFormDialog open={target.kind === "form"} row={formRow} onClose={closeOverlay} />
      <BulkToExpenseModal
        open={target.kind === "bulk-to-expense"}
        carryoverIds={viewModel.selectedIds}
        rows={selectedRows}
        onClose={closeOverlay}
        onDone={afterWrite}
      />
      <DeleteCarryoverDialog
        open={singleDeleteRow !== null}
        row={singleDeleteRow}
        onClose={closeOverlay}
        onDone={afterWrite}
      />
      <BulkDeleteCarryoverDialog
        open={deleteRows.length > 1}
        rows={deleteRows}
        onClose={closeOverlay}
        onDone={afterWrite}
      />
      <UnpayCarryoverDialog open={unpayRow !== null} row={unpayRow} onClose={closeOverlay} onDone={afterWrite} />
      <CarryoverDetailDrawer carryoverId={drawerId} open={target.kind === "drawer"} onClose={closeOverlay} />
    </>
  );
}

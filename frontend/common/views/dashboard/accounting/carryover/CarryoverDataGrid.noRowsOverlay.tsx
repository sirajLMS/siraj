"use client";

import type { ComponentType } from "react";
import { CarryoverEmptyStateContent } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverDataGrid.footer";
import type { CarryoverLabels } from "@/shared/locale/types/dashboard/accounting/carryover";

/**
 * Builds the zero-row slot component with the empty-state copy bound. Mirroring
 * the data-grid overlay factories, the slot component is built by a
 * module-scope factory: oxlint forbids defining components inline inside a
 * render function.
 */
export function createCarryoverNoRowsOverlay(labels: CarryoverLabels): ComponentType {
  return function CarryoverNoRowsOverlay() {
    return <CarryoverEmptyStateContent heading={labels.emptyStateHeading} hint={labels.emptyStateHint} />;
  };
}

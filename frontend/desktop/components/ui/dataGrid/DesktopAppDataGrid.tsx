"use client";

import type { DataGridProps, GridValidRowModel } from "@mui/x-data-grid";
import { AppDataGridChrome } from "@/frontend/common/components/ui/dataGrid/appDataGridShared";
import type {
  AppDataGridSharedProps,
  AppDataGridSlotProps,
} from "@/frontend/common/components/ui/dataGrid/types/appDataGridShared.types";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { DesktopAppDataGridLoadingOverlay } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGridLoadingOverlay";
import { DesktopAppDataGridNoRowsOverlay } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGridNoRowsOverlay";
import { DesktopGridPagination } from "@/frontend/desktop/components/ui/filter/paginationControls.desktop";

type OmittedDataGridProps =
  | "paginationMode"
  | "paginationModel"
  | "onPaginationModelChange"
  | "rowCount"
  | "hideFooter"
  | "pageSizeOptions"
  | "slots";

export interface DesktopAppDataGridProps<R extends GridValidRowModel>
  extends Omit<DataGridProps<R>, OmittedDataGridProps> {
  readonly emptyMessage?: string;
  readonly ariaLabel?: string;
  readonly paginationOptions: ListPaginationOptions;
  readonly slots?: Omit<NonNullable<DataGridProps<R>["slots"]>, "pagination">;
}

export function DesktopAppDataGrid<R extends GridValidRowModel>({
  emptyMessage,
  ariaLabel,
  paginationOptions,
  initialState,
  slots,
  slotProps,
  sx,
  ...props
}: Readonly<DesktopAppDataGridProps<R>>) {
  const sharedProps: AppDataGridSharedProps<R> = {
    emptyMessage,
    ariaLabel,
    paginationOptions,
    initialState,
    slots,
    slotProps,
    sx,
    ...props,
  };

  const desktopSlots: AppDataGridSlotProps<R> = {
    LoadingOverlay: DesktopAppDataGridLoadingOverlay,
    NoRowsOverlay: DesktopAppDataGridNoRowsOverlay,
    GridPagination: DesktopGridPagination,
  };

  return <AppDataGridChrome props={sharedProps} slots={desktopSlots} />;
}

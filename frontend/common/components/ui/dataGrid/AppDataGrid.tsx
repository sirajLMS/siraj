"use client";

import type { GridValidRowModel } from "@mui/x-data-grid";
import { AppDataGridLoadingOverlay } from "@/frontend/common/components/ui/dataGrid/AppDataGridLoadingOverlay";
import { AppDataGridNoRowsOverlay } from "@/frontend/common/components/ui/dataGrid/AppDataGridNoRowsOverlay";
import { AppDataGridChrome } from "@/frontend/common/components/ui/dataGrid/appDataGridShared";
import type { AppDataGridSharedProps } from "@/frontend/common/components/ui/dataGrid/types/appDataGridShared.types";
import { GridPagination } from "@/frontend/common/components/ui/filter/PaginationControls";

export type AppDataGridProps<R extends GridValidRowModel> = AppDataGridSharedProps<R>;

export function AppDataGrid<R extends GridValidRowModel>(props: Readonly<AppDataGridProps<R>>) {
  return (
    <AppDataGridChrome
      props={props}
      slots={{
        LoadingOverlay: AppDataGridLoadingOverlay,
        NoRowsOverlay: AppDataGridNoRowsOverlay,
        GridPagination,
      }}
    />
  );
}

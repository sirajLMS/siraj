"use client";

import { Box } from "@mui/material";
import { DataGrid, type DataGridProps, type GridValidRowModel } from "@mui/x-data-grid";
import { useMemo } from "react";
import { AppDataGridLoadingOverlay } from "@/frontend/common/components/ui/dataGrid/AppDataGridLoadingOverlay";
import { AppDataGridNoRowsOverlay } from "@/frontend/common/components/ui/dataGrid/AppDataGridNoRowsOverlay";
import { mapPaginationOptionsToDataGridProps } from "@/frontend/common/components/ui/dataGrid/mapPaginationOptionsToDataGridProps";
import { GridPagination } from "@/frontend/common/components/ui/filter/PaginationControls";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";

type OmittedDataGridProps =
  | "paginationMode"
  | "paginationModel"
  | "onPaginationModelChange"
  | "rowCount"
  | "hideFooter"
  | "pageSizeOptions"
  | "slots";

export interface AppDataGridProps<R extends GridValidRowModel> extends Omit<DataGridProps<R>, OmittedDataGridProps> {
  readonly emptyMessage?: string;
  readonly ariaLabel?: string;
  readonly paginationOptions: ListPaginationOptions;
  readonly slots?: Omit<NonNullable<DataGridProps<R>["slots"]>, "pagination">;
}

function createNoRowsOverlay(message: string) {
  return function NoRowsOverlay() {
    return <AppDataGridNoRowsOverlay message={message} />;
  };
}

export function AppDataGrid<R extends GridValidRowModel>({
  emptyMessage = "No entries found",
  ariaLabel,
  paginationOptions,
  initialState,
  slots,
  slotProps,
  sx,
  ...props
}: Readonly<AppDataGridProps<R>>) {
  const defaultGridSx = {
    border: "none",
    borderRadius: 0,
    // MUI DataGrid cells default to display:block; text then sticks to the top
    // while taller renderCell content (avatars, icon buttons) looks mid-row.
    "& .MuiDataGrid-cell": {
      display: "flex",
      alignItems: "center",
    },
    "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
      outline: "none",
    },
    "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": {
      outline: "none",
    },
  };

  const NoRowsOverlay = useMemo(() => createNoRowsOverlay(emptyMessage), [emptyMessage]);
  const paginationProps = mapPaginationOptionsToDataGridProps(paginationOptions);

  return (
    <Box sx={{ width: "100%" }} aria-label={ariaLabel}>
      <DataGrid<R>
        disableRowSelectionOnClick
        {...paginationProps}
        initialState={{
          ...paginationProps.initialState,
          ...initialState,
          pagination: {
            ...paginationProps.initialState?.pagination,
            ...initialState?.pagination,
          },
        }}
        slots={{
          noRowsOverlay: NoRowsOverlay,
          loadingOverlay: AppDataGridLoadingOverlay,
          ...slots,
          pagination: GridPagination,
        }}
        slotProps={slotProps}
        sx={mergeSx(defaultGridSx, sx)}
        {...props}
      />
    </Box>
  );
}

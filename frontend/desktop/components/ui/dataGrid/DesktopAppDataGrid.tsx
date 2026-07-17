"use client";

import { Box } from "@mui/material";
import { DataGrid, type DataGridProps, type GridValidRowModel } from "@mui/x-data-grid";
import { useMemo } from "react";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { DesktopAppDataGridLoadingOverlay } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGridLoadingOverlay";
import { DesktopAppDataGridNoRowsOverlay } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGridNoRowsOverlay";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export interface DesktopAppDataGridProps<R extends GridValidRowModel> extends DataGridProps<R> {
  readonly emptyMessage?: string;
  readonly ariaLabel?: string;
}

function createNoRowsOverlay(message: string) {
  return function NoRowsOverlay() {
    return <DesktopAppDataGridNoRowsOverlay message={message} />;
  };
}

export function DesktopAppDataGrid<R extends GridValidRowModel>({
  emptyMessage = "No entries found",
  ariaLabel,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  initialState,
  slots,
  slotProps,
  sx,
  ...props
}: Readonly<DesktopAppDataGridProps<R>>) {
  const defaultGridSx = {
    border: "none",
    borderRadius: 0,
    "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
      outline: "none",
    },
    "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": {
      outline: "none",
    },
  };

  const NoRowsOverlay = useMemo(() => createNoRowsOverlay(emptyMessage), [emptyMessage]);

  return (
    <Box sx={{ width: "100%" }} aria-label={ariaLabel}>
      <DataGrid<R>
        disableRowSelectionOnClick
        pageSizeOptions={pageSizeOptions}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } },
          ...initialState,
        }}
        slots={{
          noRowsOverlay: NoRowsOverlay,
          loadingOverlay: DesktopAppDataGridLoadingOverlay,
          ...slots,
        }}
        slotProps={slotProps}
        sx={mergeSx(defaultGridSx, sx)}
        {...props}
      />
    </Box>
  );
}

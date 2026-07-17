"use client";

import { Box } from "@mui/material";
import { DataGrid, type DataGridProps, type GridValidRowModel } from "@mui/x-data-grid";
import { useMemo } from "react";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { MobileAppDataGridLoadingOverlay } from "@/frontend/mobile/components/ui/dataGrid/MobileAppDataGridLoadingOverlay";
import { MobileAppDataGridNoRowsOverlay } from "@/frontend/mobile/components/ui/dataGrid/MobileAppDataGridNoRowsOverlay";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25] as const;

export interface MobileAppDataGridProps<R extends GridValidRowModel> extends DataGridProps<R> {
  readonly emptyMessage?: string;
  readonly ariaLabel?: string;
}

function createNoRowsOverlay(message: string) {
  return function NoRowsOverlay() {
    return <MobileAppDataGridNoRowsOverlay message={message} />;
  };
}

export function MobileAppDataGrid<R extends GridValidRowModel>({
  emptyMessage = "No entries found",
  ariaLabel,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  getRowHeight,
  initialState,
  slots,
  slotProps,
  sx,
  ...props
}: Readonly<MobileAppDataGridProps<R>>) {
  const defaultGridSx = {
    border: "none",
    borderRadius: 0,
    "& .MuiDataGrid-cell": {
      py: (theme: { spacing: (n: number) => string }) => theme.spacing(1.25),
    },
    "& .MuiDataGrid-columnHeader": {
      py: (theme: { spacing: (n: number) => string }) => theme.spacing(0.75),
    },
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
        density="compact"
        disableRowSelectionOnClick
        getRowHeight={getRowHeight ?? (() => 56)}
        pageSizeOptions={pageSizeOptions}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } },
          ...initialState,
        }}
        slots={{
          noRowsOverlay: NoRowsOverlay,
          loadingOverlay: MobileAppDataGridLoadingOverlay,
          ...slots,
        }}
        slotProps={slotProps}
        sx={mergeSx(defaultGridSx, sx)}
        {...props}
      />
    </Box>
  );
}

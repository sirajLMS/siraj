"use client";

import { Box } from "@mui/material";
import { DataGrid, type DataGridProps, type GridValidRowModel } from "@mui/x-data-grid";
import { useMemo } from "react";
import { mapPaginationOptionsToDataGridProps } from "@/frontend/common/components/ui/dataGrid/mapPaginationOptionsToDataGridProps";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { MobileAppDataGridLoadingOverlay } from "@/frontend/mobile/components/ui/dataGrid/MobileAppDataGridLoadingOverlay";
import { MobileAppDataGridNoRowsOverlay } from "@/frontend/mobile/components/ui/dataGrid/MobileAppDataGridNoRowsOverlay";
import { MobileGridPagination } from "@/frontend/mobile/components/ui/filter/paginationControls.mobile";
import { Translation, useAppTranslation } from "@/shared/locale";

type OmittedDataGridProps =
  | "paginationMode"
  | "paginationModel"
  | "onPaginationModelChange"
  | "rowCount"
  | "hideFooter"
  | "pageSizeOptions"
  | "slots";

export interface MobileAppDataGridProps<R extends GridValidRowModel>
  extends Omit<DataGridProps<R>, OmittedDataGridProps> {
  readonly emptyMessage?: string;
  readonly ariaLabel?: string;
  readonly paginationOptions: ListPaginationOptions;
  readonly slots?: Omit<NonNullable<DataGridProps<R>["slots"]>, "pagination">;
}

function createNoRowsOverlay(message: string) {
  return function NoRowsOverlay() {
    return <MobileAppDataGridNoRowsOverlay message={message} />;
  };
}

export function MobileAppDataGrid<R extends GridValidRowModel>({
  emptyMessage,
  ariaLabel,
  paginationOptions,
  getRowHeight,
  initialState,
  slots,
  slotProps,
  sx,
  ...props
}: Readonly<MobileAppDataGridProps<R>>) {
  const commonLabels = useAppTranslation(Translation.Common);
  const resolvedEmptyMessage = emptyMessage ?? commonLabels.noEntriesFound;
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

  const NoRowsOverlay = useMemo(() => createNoRowsOverlay(resolvedEmptyMessage), [resolvedEmptyMessage]);
  const paginationProps = mapPaginationOptionsToDataGridProps(paginationOptions);

  return (
    <Box sx={{ width: "100%" }} aria-label={ariaLabel}>
      <DataGrid<R>
        density="compact"
        disableRowSelectionOnClick
        getRowHeight={getRowHeight ?? (() => 56)}
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
          loadingOverlay: MobileAppDataGridLoadingOverlay,
          ...slots,
          pagination: MobileGridPagination,
        }}
        slotProps={slotProps}
        sx={mergeSx(defaultGridSx, sx)}
        {...props}
      />
    </Box>
  );
}

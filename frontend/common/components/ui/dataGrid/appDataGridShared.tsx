"use client";

import { Box } from "@mui/material";
import { DataGrid, type GridValidRowModel } from "@mui/x-data-grid";
import { useMemo } from "react";
import { createNoRowsOverlay, defaultGridSx } from "@/frontend/common/components/ui/dataGrid/appDataGridSharedUtils";
import { mapPaginationOptionsToDataGridProps } from "@/frontend/common/components/ui/dataGrid/mapPaginationOptionsToDataGridProps";
import type {
  AppDataGridSharedProps,
  AppDataGridSlotProps,
} from "@/frontend/common/components/ui/dataGrid/types/appDataGridShared.types";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { Translation, useAppTranslation } from "@/shared/locale";

export function AppDataGridChrome<R extends GridValidRowModel>({
  props,
  slots,
}: Readonly<{
  props: Readonly<AppDataGridSharedProps<R>>;
  slots: Readonly<AppDataGridSlotProps<R>>;
}>) {
  const commonLabels = useAppTranslation(Translation.Common);
  const {
    emptyMessage = commonLabels.noEntriesFound,
    ariaLabel,
    paginationOptions,
    initialState,
    slots: extraSlots,
    slotProps,
    sx,
    ...rest
  } = props;

  const NoRowsOverlay = useMemo(
    () => createNoRowsOverlay(slots.NoRowsOverlay, emptyMessage),
    [emptyMessage, slots.NoRowsOverlay]
  );
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
          loadingOverlay: slots.LoadingOverlay,
          ...extraSlots,
          pagination: slots.GridPagination,
        }}
        slotProps={slotProps}
        sx={mergeSx(defaultGridSx, sx)}
        {...rest}
      />
    </Box>
  );
}

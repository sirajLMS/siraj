import type { DataGridProps, GridPaginationModel, GridValidRowModel } from "@mui/x-data-grid";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";

const DEFAULT_CLIENT_PAGE_SIZE = 10;
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

type DataGridPaginationProps = Pick<
  DataGridProps<GridValidRowModel>,
  | "hideFooter"
  | "paginationMode"
  | "paginationModel"
  | "onPaginationModelChange"
  | "rowCount"
  | "pageSizeOptions"
  | "initialState"
>;

/**
 * Maps `ListPaginationOptions` to MUI X DataGrid pagination props.
 * Pagination UI slot is forced by the AppDataGrid wrappers separately.
 */
export function mapPaginationOptionsToDataGridProps(paginationOptions: ListPaginationOptions): DataGridPaginationProps {
  if (paginationOptions === false) {
    return { hideFooter: true };
  }

  if (paginationOptions.mode === "client") {
    const pageSize = paginationOptions.pageSize ?? DEFAULT_CLIENT_PAGE_SIZE;
    const pageSizeOptions = paginationOptions.pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS;
    return {
      paginationMode: "client",
      pageSizeOptions: [...pageSizeOptions],
      initialState: {
        pagination: { paginationModel: { pageSize, page: 0 } },
      },
    };
  }

  const pageSizeOptions = paginationOptions.pageSizeOptions ?? [paginationOptions.pageSize];

  return {
    paginationMode: "server",
    rowCount: paginationOptions.totalCount,
    paginationModel: {
      page: paginationOptions.page,
      pageSize: paginationOptions.pageSize,
    },
    onPaginationModelChange: (model: GridPaginationModel) => {
      if (model.pageSize !== paginationOptions.pageSize) {
        paginationOptions.onPageSizeChange?.(model.pageSize);
        return;
      }
      if (model.page !== paginationOptions.page) {
        paginationOptions.onPageChange(model.page);
      }
    },
    pageSizeOptions: [...pageSizeOptions],
  };
}

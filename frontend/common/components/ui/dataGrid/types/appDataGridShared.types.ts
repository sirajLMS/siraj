import type { DataGridProps, GridOverlayProps, GridValidRowModel } from "@mui/x-data-grid";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";

type OmittedDataGridProps =
  | "paginationMode"
  | "paginationModel"
  | "onPaginationModelChange"
  | "rowCount"
  | "hideFooter"
  | "pageSizeOptions"
  | "slots";

export interface AppDataGridSharedProps<R extends GridValidRowModel>
  extends Omit<DataGridProps<R>, OmittedDataGridProps> {
  readonly emptyMessage?: string;
  readonly ariaLabel?: string;
  readonly paginationOptions: ListPaginationOptions;
  readonly slots?: Omit<NonNullable<DataGridProps<R>["slots"]>, "pagination">;
}

export interface AppDataGridSlotProps<R extends GridValidRowModel> {
  readonly LoadingOverlay: React.ComponentType<GridOverlayProps>;
  readonly NoRowsOverlay: React.ComponentType<{ readonly message: string }>;
  readonly GridPagination: NonNullable<DataGridProps<R>["slots"]>["pagination"];
}

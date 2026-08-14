"use client";

import {
  gridPageCountSelector,
  gridPageSelector,
  gridPageSizeSelector,
  gridPaginationRowCountSelector,
  useGridApiContext,
  useGridSelector,
} from "@mui/x-data-grid";
import {
  PaginationControlsScaffold,
  type PaginationControlsSharedProps,
  type PaginationControlsSlotProps,
} from "@/frontend/common/components/ui/filter/PaginationControlsShared";

export type { PaginationControlsSharedProps as PaginationControlsProps } from "./PaginationControlsShared";

const COMMON_SLOT_PROPS: PaginationControlsSlotProps = {
  rootGap: 1.5,
  rootPaddingInline: 2,
  rootPaddingBlock: 1.5,
  inputWidth: 56,
  navButtonSize: undefined,
  borderColor: theme => theme.palette.outlineVariant,
  backgroundColor: theme => theme.palette.surfaceContainerLow,
  embeddedTransparent: true,
  labelColor: theme => theme.palette.onSurfaceVariant,
  navButtonBackground: theme => theme.palette.surfaceContainerHigh,
  navButtonColor: theme => theme.palette.onSurfaceVariant,
};

export function PaginationControls(props: Readonly<PaginationControlsSharedProps>) {
  return <PaginationControlsScaffold {...props} {...COMMON_SLOT_PROPS} />;
}

export function GridPagination() {
  const apiRef = useGridApiContext();
  const page = useGridSelector(apiRef, gridPageSelector);
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);
  const rowCount = useGridSelector(apiRef, gridPaginationRowCountSelector);
  const pageSize = useGridSelector(apiRef, gridPageSizeSelector);

  return (
    <PaginationControls
      embedded
      page={page}
      pageCount={pageCount}
      rowCount={rowCount}
      pageSize={pageSize}
      onPageChange={nextPage => {
        apiRef.current.setPage(nextPage);
      }}
    />
  );
}

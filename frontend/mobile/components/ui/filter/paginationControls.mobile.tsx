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

export type MobilePaginationControlsProps = PaginationControlsSharedProps;

const MOBILE_SLOT_PROPS: PaginationControlsSlotProps = {
  rootGap: 1,
  rootPaddingInline: 1.5,
  rootPaddingBlock: 1,
  inputWidth: 48,
  navButtonSize: 32,
  borderColor: theme => theme.palette.outlineVariant,
  backgroundColor: theme => theme.palette.surfaceContainerLow,
  embeddedTransparent: false,
  labelColor: theme => theme.palette.onSurfaceVariant,
  navButtonBackground: theme => theme.palette.surfaceContainerHigh,
  navButtonColor: theme => theme.palette.onSurfaceVariant,
};

export function MobilePaginationControls(props: Readonly<MobilePaginationControlsProps>) {
  return <PaginationControlsScaffold {...props} {...MOBILE_SLOT_PROPS} />;
}

export function MobileGridPagination() {
  const apiRef = useGridApiContext();
  const page = useGridSelector(apiRef, gridPageSelector);
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);
  const rowCount = useGridSelector(apiRef, gridPaginationRowCountSelector);
  const pageSize = useGridSelector(apiRef, gridPageSizeSelector);

  return (
    <MobilePaginationControls
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

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

export type DesktopPaginationControlsProps = PaginationControlsSharedProps;

const DESKTOP_SLOT_PROPS: PaginationControlsSlotProps = {
  rootGap: 1.5,
  rootPaddingInline: 2,
  rootPaddingBlock: 1.5,
  inputWidth: 56,
  navButtonSize: 40,
  borderColor: theme => theme.palette.border.light,
  backgroundColor: theme => theme.palette.background.default,
  embeddedTransparent: true,
  labelColor: theme => theme.palette.text.secondary,
  navButtonBackground: () => "transparent",
  navButtonColor: theme => theme.palette.text.secondary,
};

export function DesktopPaginationControls(props: Readonly<DesktopPaginationControlsProps>) {
  return <PaginationControlsScaffold {...props} {...DESKTOP_SLOT_PROPS} />;
}

export function DesktopGridPagination({ hideRangeLabel = false }: Readonly<{ readonly hideRangeLabel?: boolean }>) {
  const apiRef = useGridApiContext();
  const page = useGridSelector(apiRef, gridPageSelector);
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);
  const rowCount = useGridSelector(apiRef, gridPaginationRowCountSelector);
  const pageSize = useGridSelector(apiRef, gridPageSizeSelector);

  return (
    <DesktopPaginationControls
      embedded
      showRangeLabel={!hideRangeLabel}
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

"use client";

import { Box, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { useState } from "react";
import {
  buildLabelSx,
  buildNavButtonSx,
  buildRootSx,
  clampPage,
  resolvePaginationRange,
} from "@/frontend/common/components/ui/filter/PaginationControlsShared.helpers";
import { PaginationNavGroup } from "@/frontend/common/components/ui/filter/PaginationControlsShared.parts";
import { Translation, useAppTranslation } from "@/shared/locale";

export interface PaginationControlsSharedProps {
  readonly page: number;
  readonly pageCount: number;
  readonly rowCount: number;
  readonly pageSize: number;
  /** When both are provided, a rows-per-page selector is rendered in the footer. */
  readonly pageSizeOptions?: readonly number[];
  readonly onPageSizeChange?: (pageSize: number) => void;
  readonly embedded?: boolean;
  /** When false, the leading "from–to of total" range label is omitted (e.g. when a page indicator already carries position context). */
  readonly showRangeLabel?: boolean;
  /** When true, removes horizontal padding so the bar sits flush with its container edges. */
  readonly flush?: boolean;
  readonly onPageChange: (page: number) => void;
}

export interface PaginationControlsSlotProps {
  /** Gap between root flex children (theme spacing units). */
  readonly rootGap: number;
  /** Inline padding of the root (theme spacing units). */
  readonly rootPaddingInline: number;
  /** Block padding of the root (theme spacing units). */
  readonly rootPaddingBlock: number;
  /** Width of the page number input in px. */
  readonly inputWidth: number;
  /** Optional fixed size for nav buttons (undefined = no fixed size). */
  readonly navButtonSize?: number;
  /** Border color resolver for both the root bar and nav buttons. */
  readonly borderColor: (theme: Theme) => string;
  /** Non-embedded background color resolver for the root bar. */
  readonly backgroundColor: (theme: Theme) => string;
  /** Whether the embedded state has a transparent background and no border. */
  readonly embeddedTransparent: boolean;
  /** Label text color resolver. */
  readonly labelColor: (theme: Theme) => string;
  /** Nav button background resolver (transparent or surface color). */
  readonly navButtonBackground: (theme: Theme) => string;
  /** Nav button text color resolver. */
  readonly navButtonColor: (theme: Theme) => string;
}

type PaginationControlsScaffoldProps = PaginationControlsSharedProps & PaginationControlsSlotProps;

export function PaginationControlsScaffold({
  page,
  pageCount,
  rowCount,
  pageSize,
  embedded = false,
  flush = false,
  showRangeLabel = true,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
  rootGap,
  rootPaddingInline,
  rootPaddingBlock,
  inputWidth,
  navButtonSize,
  borderColor,
  backgroundColor,
  embeddedTransparent,
  labelColor,
  navButtonBackground,
  navButtonColor,
}: Readonly<PaginationControlsScaffoldProps>) {
  const t = useAppTranslation(Translation.Dashboard.Admin);
  const [pageInput, setPageInput] = useState(String(page + 1));
  const [lastPage, setLastPage] = useState(page);

  if (page !== lastPage) {
    setLastPage(page);
    setPageInput(String(page + 1));
  }

  const { safePageCount, isEmpty, from, to } = resolvePaginationRange(page, pageCount, rowCount, pageSize);

  const commitPageInput = () => {
    const parsedPage = Number.parseInt(pageInput, 10);
    if (Number.isNaN(parsedPage) || safePageCount === 0) {
      setPageInput(String(page + 1));
      return undefined;
    }

    const nextPage = clampPage(parsedPage - 1, safePageCount);
    onPageChange(nextPage);
    setPageInput(String(nextPage + 1));
    return undefined;
  };

  const showPageSizeSelect =
    pageSizeOptions !== undefined && pageSizeOptions.length > 0 && onPageSizeChange !== undefined;

  const rootSx = buildRootSx({
    rootGap,
    rootPaddingInline,
    rootPaddingBlock,
    flush,
    showRangeLabel,
    embedded,
    embeddedTransparent,
    borderColor,
    backgroundColor,
  });
  const navButtonSx = buildNavButtonSx({
    navButtonSize,
    borderColor,
    navButtonBackground,
    navButtonColor,
  });
  const labelSx = buildLabelSx(labelColor);

  return (
    <Box sx={rootSx}>
      {!isEmpty && showRangeLabel ? (
        <Typography variant="labelMd" sx={labelSx}>
          {t.paginationRange(from, to, rowCount)}
        </Typography>
      ) : null}

      {isEmpty ? (
        <Typography variant="labelMd" sx={labelSx}>
          {t.noData}
        </Typography>
      ) : (
        <PaginationNavGroup
          page={page}
          safePageCount={safePageCount}
          pageInput={pageInput}
          onPageInputChange={setPageInput}
          onCommitPageInput={commitPageInput}
          onPageChange={onPageChange}
          inputWidth={inputWidth}
          navButtonSx={navButtonSx}
          labelSx={labelSx}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          showPageSizeSelect={showPageSizeSelect}
          onPageSizeChange={onPageSizeChange}
          labels={{
            rowsPerPage: t.rowsPerPage,
            previousPage: t.previousPage,
            nextPage: t.nextPage,
            goToPage: t.goToPage,
            pageOf: t.pageOf,
          }}
        />
      )}
    </Box>
  );
}

"use client";

import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { Box, IconButton, TextField, Tooltip, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  gridPageCountSelector,
  gridPageSelector,
  gridPageSizeSelector,
  gridPaginationRowCountSelector,
  useGridApiContext,
  useGridSelector,
} from "@mui/x-data-grid";
import { useEffect, useState } from "react";
import { rtlFlipIconSx } from "@/frontend/common/utils/rtlFlipIconSx";
import { Translation, useAppTranslation } from "@/shared/locale";

export interface MobilePaginationControlsProps {
  readonly page: number;
  readonly pageCount: number;
  readonly rowCount: number;
  readonly pageSize: number;
  readonly embedded?: boolean;
  readonly onPageChange: (page: number) => void;
}

const StyledPaginationRoot = styled(Box, {
  shouldForwardProp: prop => prop !== "embedded",
})<{ embedded?: boolean }>(({ theme, embedded }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: theme.spacing(1),
  width: "100%",
  paddingInline: theme.spacing(1.5),
  paddingBlock: theme.spacing(1),
  ...(embedded
    ? {
        backgroundColor: theme.palette.surfaceContainerLow,
        borderTop: `1px solid ${theme.palette.outlineVariant}`,
      }
    : {
        borderTop: `1px solid ${theme.palette.outlineVariant}`,
        backgroundColor: theme.palette.surfaceContainerLow,
      }),
}));

const StyledPaginationActions = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const StyledPageInput = styled(TextField)({
  width: 48,
  "& .MuiInputBase-input": {
    textAlign: "center",
    paddingBlock: 6,
  },
});

const StyledPageNavButton = styled(IconButton)(({ theme }) => ({
  border: `1px solid ${theme.palette.outlineVariant}`,
  borderRadius: Number(theme.shape.borderRadius),
  backgroundColor: theme.palette.surfaceContainerHigh,
  color: theme.palette.onSurfaceVariant,
  width: 32,
  height: 32,
  "&.Mui-disabled": {
    opacity: 0.5,
  },
}));

function clampPage(page: number, pageCount: number): number {
  if (pageCount <= 0) {
    return 0;
  }
  return Math.min(Math.max(page, 0), pageCount - 1);
}

export function MobilePaginationControls({
  page,
  pageCount,
  rowCount,
  pageSize,
  embedded = false,
  onPageChange,
}: MobilePaginationControlsProps) {
  const t = useAppTranslation(Translation.Dashboard.Admin);
  const [pageInput, setPageInput] = useState(String(page + 1));

  useEffect(() => {
    setPageInput(String(page + 1));
  }, [page]);

  const safePageCount = Math.max(pageCount, rowCount > 0 ? 1 : 0);
  const from = rowCount === 0 ? 0 : page * pageSize + 1;
  const to = rowCount === 0 ? 0 : Math.min(rowCount, (page + 1) * pageSize);

  const commitPageInput = () => {
    const parsedPage = Number.parseInt(pageInput, 10);
    if (Number.isNaN(parsedPage) || safePageCount === 0) {
      setPageInput(String(page + 1));
      return;
    }

    const nextPage = clampPage(parsedPage - 1, safePageCount);
    onPageChange(nextPage);
    setPageInput(String(nextPage + 1));
  };

  return (
    <StyledPaginationRoot embedded={embedded}>
      <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
        {t.paginationRange(from, to, rowCount)}
      </Typography>

      <StyledPaginationActions>
        <Tooltip title={t.previousPage}>
          <span>
            <StyledPageNavButton
              size="small"
              disabled={page <= 0 || safePageCount === 0}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft fontSize="small" sx={rtlFlipIconSx} />
            </StyledPageNavButton>
          </span>
        </Tooltip>

        <StyledPageInput
          size="small"
          value={pageInput}
          disabled={safePageCount === 0}
          onChange={event => setPageInput(event.target.value)}
          onBlur={commitPageInput}
          onKeyDown={event => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitPageInput();
            }
          }}
          slotProps={{
            htmlInput: {
              "aria-label": t.goToPage,
              inputMode: "numeric",
            },
          }}
        />

        <Tooltip title={t.nextPage}>
          <span>
            <StyledPageNavButton
              size="small"
              disabled={safePageCount === 0 || page >= safePageCount - 1}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight fontSize="small" sx={rtlFlipIconSx} />
            </StyledPageNavButton>
          </span>
        </Tooltip>

        <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {t.pageOf(safePageCount === 0 ? 0 : page + 1, safePageCount)}
        </Typography>
      </StyledPaginationActions>
    </StyledPaginationRoot>
  );
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

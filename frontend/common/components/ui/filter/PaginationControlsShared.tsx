"use client";

import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { Box, IconButton, TextField, Tooltip, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { useState } from "react";
import { rtlFlipIconSx } from "@/frontend/common/utils/rtlFlipIconSx";
import { Translation, useAppTranslation } from "@/shared/locale";

export interface PaginationControlsSharedProps {
  readonly page: number;
  readonly pageCount: number;
  readonly rowCount: number;
  readonly pageSize: number;
  readonly embedded?: boolean;
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

function clampPage(page: number, pageCount: number): number {
  if (pageCount <= 0) {
    return 0;
  }
  return Math.min(Math.max(page, 0), pageCount - 1);
}

export function PaginationControlsScaffold({
  page,
  pageCount,
  rowCount,
  pageSize,
  embedded = false,
  flush = false,
  onPageChange,
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
  const [pageInputState, setPageInputState] = useState(String(page + 1));
  const [lastPage, setLastPage] = useState(page);

  if (page !== lastPage) {
    setLastPage(page);
    setPageInputState(String(page + 1));
  }

  const pageInput = pageInputState;
  const setPageInput = setPageInputState;

  const safePageCount = Math.max(pageCount, rowCount > 0 ? 1 : 0);
  const from = rowCount === 0 ? 0 : page * pageSize + 1;
  const to = rowCount === 0 ? 0 : Math.min(rowCount, (page + 1) * pageSize);

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

  const rootSx = (theme: Theme) => {
    const useTransparent = embedded && embeddedTransparent;
    return {
      display: "flex" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      flexWrap: "wrap" as const,
      gap: theme.spacing(rootGap),
      width: "100%",
      paddingInline: flush ? 0 : theme.spacing(rootPaddingInline),
      paddingBlock: theme.spacing(rootPaddingBlock),
      ...(useTransparent
        ? {
            backgroundColor: "transparent",
            borderTop: "none",
          }
        : {
            borderTop: `1px solid ${borderColor(theme)}`,
            backgroundColor: backgroundColor(theme),
          }),
    };
  };

  const navButtonSx = (theme: Theme) => ({
    border: `1px solid ${borderColor(theme)}`,
    borderRadius: Number(theme.shape.borderRadius),
    backgroundColor: navButtonBackground(theme),
    color: navButtonColor(theme),
    ...(navButtonSize ? { width: navButtonSize, height: navButtonSize } : {}),
    "&.Mui-disabled": {
      opacity: 0.5,
    },
  });

  const labelSx = (theme: Theme) => ({ color: labelColor(theme) });

  return (
    <Box sx={rootSx}>
      <Typography variant="labelMd" sx={labelSx}>
        {t.paginationRange(from, to, rowCount)}
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Tooltip title={t.previousPage}>
          <span>
            <IconButton
              size="small"
              disabled={page <= 0 || safePageCount === 0}
              onClick={() => onPageChange(page - 1)}
              sx={navButtonSx}
            >
              <ChevronLeft fontSize="small" sx={rtlFlipIconSx} />
            </IconButton>
          </span>
        </Tooltip>

        <TextField
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
          sx={{ width: inputWidth, "& .MuiInputBase-input": { textAlign: "center", paddingBlock: 1 } }}
        />

        <Tooltip title={t.nextPage}>
          <span>
            <IconButton
              size="small"
              disabled={safePageCount === 0 || page >= safePageCount - 1}
              onClick={() => onPageChange(page + 1)}
              sx={navButtonSx}
            >
              <ChevronRight fontSize="small" sx={rtlFlipIconSx} />
            </IconButton>
          </span>
        </Tooltip>

        <Typography variant="labelMd" sx={labelSx}>
          {t.pageOf(safePageCount === 0 ? 0 : page + 1, safePageCount)}
        </Typography>
      </Box>
    </Box>
  );
}

import type { SxProps, Theme } from "@mui/material/styles";

export function clampPage(page: number, pageCount: number): number {
  if (pageCount <= 0) {
    return 0;
  }
  return Math.min(Math.max(page, 0), pageCount - 1);
}

export interface PaginationRange {
  readonly safePageCount: number;
  readonly isEmpty: boolean;
  readonly from: number;
  readonly to: number;
}

export function resolvePaginationRange(
  page: number,
  pageCount: number,
  rowCount: number,
  pageSize: number
): PaginationRange {
  const safePageCount = Math.max(pageCount, rowCount > 0 ? 1 : 0);
  const isEmpty = rowCount === 0;
  return {
    safePageCount,
    isEmpty,
    from: isEmpty ? 0 : page * pageSize + 1,
    to: isEmpty ? 0 : Math.min(rowCount, (page + 1) * pageSize),
  };
}

export interface RootSxParams {
  readonly rootGap: number;
  readonly rootPaddingInline: number;
  readonly rootPaddingBlock: number;
  readonly flush: boolean;
  readonly showRangeLabel: boolean;
  readonly embedded: boolean;
  readonly embeddedTransparent: boolean;
  readonly borderColor: (theme: Theme) => string;
  readonly backgroundColor: (theme: Theme) => string;
}

export function buildRootSx(params: RootSxParams): SxProps<Theme> {
  const {
    rootGap,
    rootPaddingInline,
    rootPaddingBlock,
    flush,
    showRangeLabel,
    embedded,
    embeddedTransparent,
    borderColor,
    backgroundColor,
  } = params;

  return (theme: Theme) => {
    const useTransparent = embedded && embeddedTransparent;
    return {
      display: "flex",
      alignItems: "center",
      justifyContent: showRangeLabel ? "space-between" : "flex-end",
      flexWrap: "wrap",
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
}

export interface NavButtonSxParams {
  readonly navButtonSize?: number;
  readonly borderColor: (theme: Theme) => string;
  readonly navButtonBackground: (theme: Theme) => string;
  readonly navButtonColor: (theme: Theme) => string;
}

export function buildNavButtonSx(params: NavButtonSxParams): SxProps<Theme> {
  const { navButtonSize, borderColor, navButtonBackground, navButtonColor } = params;

  return (theme: Theme) => ({
    border: `1px solid ${borderColor(theme)}`,
    borderRadius: Number(theme.shape.borderRadius),
    backgroundColor: navButtonBackground(theme),
    color: navButtonColor(theme),
    ...(navButtonSize ? { width: navButtonSize, height: navButtonSize } : {}),
    "&.Mui-disabled": {
      opacity: 0.5,
    },
  });
}

export function buildLabelSx(labelColor: (theme: Theme) => string): SxProps<Theme> {
  return (theme: Theme) => ({ color: labelColor(theme) });
}

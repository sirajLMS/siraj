"use client";

import type { SxProps, Theme } from "@mui/material";
import { Box, Skeleton } from "@mui/material";
import { HorizontalScrollRow } from "@/frontend/common/components/ui/container/HorizontalScrollRow";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import type { SearchScheduleResultsSkeletonProps } from "@/frontend/common/views/dashboard/search-schedule/types";

export interface SearchScheduleResultsSkeletonSlotProps {
  /** Outer container sx — tier-specific spacing/gap. */
  readonly outerSx?: SxProps<Theme>;
  /** Title skeleton sx — mobile adds `mx: 2` for content gutter. */
  readonly titleSx?: SxProps<Theme>;
  /** Card count gap — desktop uses 1.5, mobile uses 2. */
  readonly cardListGap?: number;
  /** Extra card shell sx merged onto each card (mobile uses edgeToEdgeCardShellSx). */
  readonly cardShellExtraSx?: SxProps<Theme>;
  /** Scroll row variant — "desktop" uses HorizontalScrollRow; "mobile" uses plain Box. */
  readonly scrollRowVariant?: "desktop" | "mobile";
}

const DEFAULT_OUTER_SX: SxProps<Theme> = { mt: 3, display: "flex", flexDirection: "column", gap: 2 };
const DEFAULT_CARD_LIST_GAP = 1.5;

function SkeletonScrollRow({
  variant,
  children,
}: Readonly<{ variant: "desktop" | "mobile"; children: React.ReactNode }>) {
  if (variant === "mobile") {
    return (
      <Box sx={{ display: "flex", flexDirection: "row", gap: 1, overflowX: "auto", paddingBottom: 1 }}>{children}</Box>
    );
  }
  return (
    <HorizontalScrollRow sx={{ gap: 1, paddingInlineStart: 0, paddingInlineEnd: 0 }}>{children}</HorizontalScrollRow>
  );
}

export function SearchScheduleResultsSkeletonShared({
  columnCount,
  cardCount = 3,
  outerSx = DEFAULT_OUTER_SX,
  titleSx,
  cardListGap = DEFAULT_CARD_LIST_GAP,
  cardShellExtraSx,
  scrollRowVariant = "desktop",
}: Readonly<SearchScheduleResultsSkeletonProps & SearchScheduleResultsSkeletonSlotProps>) {
  const pillCount = Math.min(columnCount, 7);

  return (
    <Box sx={outerSx}>
      <Skeleton variant="text" width="40%" height={32} sx={titleSx} />

      <Box sx={{ display: "flex", flexDirection: "column", gap: cardListGap }}>
        {Array.from({ length: cardCount }, (_, cardIndex) => (
          <Box
            key={`skeleton-card-${String(cardIndex)}`}
            sx={mergeSx(
              theme => ({
                p: 1.5,
                borderRadius: 2,
                border: `1px solid ${theme.palette.outlineVariant}`,
                backgroundColor: theme.palette.surface,
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }),
              cardShellExtraSx
            )}
          >
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Skeleton variant="text" width={180} height={28} />
              <Skeleton variant="rounded" width={72} height={24} />
              <Skeleton variant="text" width={120} height={24} />
            </Box>

            <SkeletonScrollRow variant={scrollRowVariant}>
              {Array.from({ length: pillCount }, (_unused, pillIndex) => (
                <Skeleton
                  key={`skeleton-pill-${String(cardIndex)}-${String(pillIndex)}`}
                  variant="rounded"
                  width={140}
                  height={36}
                />
              ))}
            </SkeletonScrollRow>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

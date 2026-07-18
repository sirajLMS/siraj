"use client";

import { Box, Skeleton } from "@mui/material";
import { HorizontalScrollRow } from "@/frontend/common/components/ui/container/HorizontalScrollRow";
import type { SearchScheduleResultsSkeletonProps } from "@/frontend/common/views/dashboard/search-schedule/types";

export function SearchScheduleResultsSkeletonDesktop({
  columnCount,
  cardCount = 3,
}: Readonly<SearchScheduleResultsSkeletonProps>) {
  const pillCount = Math.min(columnCount, 7);

  return (
    <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 2 }}>
      <Skeleton variant="text" width="40%" height={32} />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {Array.from({ length: cardCount }, (_, cardIndex) => (
          <Box
            key={`skeleton-card-${String(cardIndex)}`}
            sx={theme => ({
              p: 1.5,
              borderRadius: 2,
              border: `1px solid ${theme.palette.outlineVariant}`,
              backgroundColor: theme.palette.surface,
              display: "flex",
              flexDirection: "column",
              gap: 1,
            })}
          >
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Skeleton variant="text" width={180} height={28} />
              <Skeleton variant="rounded" width={72} height={24} />
              <Skeleton variant="text" width={120} height={24} />
            </Box>

            <HorizontalScrollRow sx={{ gap: 1, paddingInlineStart: 0, paddingInlineEnd: 0 }}>
              {Array.from({ length: pillCount }, (_, pillIndex) => (
                <Skeleton
                  key={`skeleton-pill-${String(cardIndex)}-${String(pillIndex)}`}
                  variant="rounded"
                  width={140}
                  height={36}
                />
              ))}
            </HorizontalScrollRow>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

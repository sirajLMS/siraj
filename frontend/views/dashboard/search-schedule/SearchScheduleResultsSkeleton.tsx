"use client";

import { Box, Skeleton } from "@mui/material";

interface SearchScheduleResultsSkeletonProps {
  readonly columnCount: number;
  readonly cardCount?: number;
}

export function SearchScheduleResultsSkeleton({
  columnCount,
  cardCount = 3,
}: Readonly<SearchScheduleResultsSkeletonProps>) {
  return (
    <Box sx={{ mt: 4 }}>
      <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {Array.from({ length: cardCount }, (_, cardIndex) => (
          <Box
            key={`skeleton-card-${String(cardIndex)}`}
            sx={theme => ({
              p: 2,
              borderRadius: 2,
              border: `1px solid ${theme.palette.outlineVariant}`,
              backgroundColor: theme.palette.surface,
            })}
          >
            <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
              <Skeleton variant="text" width={180} height={28} />
              <Skeleton variant="rounded" width={72} height={24} />
              <Skeleton variant="text" width={120} height={24} />
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: `repeat(${Math.max(columnCount, 1)}, minmax(0, 1fr))` },
                gap: 1.5,
              }}
            >
              {Array.from({ length: columnCount }, (_, columnIndex) => (
                <Skeleton
                  key={`skeleton-column-${String(cardIndex)}-${String(columnIndex)}`}
                  variant="rounded"
                  height={100}
                />
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

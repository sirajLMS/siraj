"use client";

import { Box, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { buildParentStudentCardLabels } from "@/frontend/common/views/dashboard/parent/students/types/parentStudentCard.types";
import type { ParentStudentsViewModel } from "@/frontend/common/views/dashboard/parent/students/useParentStudentsViewModel";
import {
  DesktopLoadingState,
  DesktopPageContainer,
  DesktopPageHeader,
  DesktopPaginationControls,
} from "@/frontend/desktop/components/ui";
import { ParentStudentDesktopCard } from "@/frontend/desktop/views/dashboard/parent/students/components/parentStudentCard.desktop";

const CLIENT_PAGE_SIZE = 10;

export function ParentStudentsDesktopView({ labels, loading, error, rows }: Readonly<ParentStudentsViewModel>) {
  const cardLabels = buildParentStudentCardLabels(labels);
  const [clientPage, setClientPage] = useState(0);

  useEffect(() => {
    const pageCount = Math.max(1, Math.ceil(rows.length / CLIENT_PAGE_SIZE) || 1);
    if (clientPage >= pageCount) {
      setClientPage(Math.max(0, pageCount - 1));
    }
  }, [clientPage, rows.length]);

  const visibleRows = useMemo(() => {
    const start = clientPage * CLIENT_PAGE_SIZE;
    return rows.slice(start, start + CLIENT_PAGE_SIZE);
  }, [clientPage, rows]);

  const pageCount = Math.max(1, Math.ceil(rows.length / CLIENT_PAGE_SIZE) || 1);

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />
      {loading && rows.length === 0 ? <DesktopLoadingState /> : null}
      {error ? (
        <Typography sx={{ color: theme => theme.palette.error.main }}>{labels.errors.failedToLoad}</Typography>
      ) : (
        <>
          {!loading && rows.length === 0 ? (
            <Typography sx={{ color: theme => theme.palette.text.secondary }}>{labels.noStudents}</Typography>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
                gap: 2,
              }}
            >
              {visibleRows.map(row => (
                <ParentStudentDesktopCard key={row.id} row={row} labels={cardLabels} />
              ))}
            </Box>
          )}
          <DesktopPaginationControls
            page={clientPage}
            pageCount={pageCount}
            rowCount={rows.length}
            pageSize={CLIENT_PAGE_SIZE}
            onPageChange={setClientPage}
          />
        </>
      )}
    </DesktopPageContainer>
  );
}

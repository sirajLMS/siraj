"use client";

import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import type {
  ParentStudentRow,
  ParentStudentsViewModel,
} from "@/frontend/common/views/dashboard/parent/students/useParentStudentsViewModel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";

function ParentStudentMobileCard({
  row,
  labels,
}: {
  readonly row: ParentStudentRow;
  readonly labels: ParentStudentsViewModel["labels"];
}) {
  return (
    <Box
      sx={theme => ({
        p: 1.5,
        borderRadius: 1,
        border: `1px solid ${theme.palette.outlineVariant}`,
        backgroundColor: theme.palette.surfaceContainerLowest,
      })}
    >
      <Typography sx={{ typography: "titleMd", fontWeight: 600 }}>{row.name}</Typography>
      <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
        {labels.statusLabel(row.status ?? "")}
      </Typography>
      {row.teacherName ? (
        <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
          {labels.teacherLabel(row.teacherName)}
        </Typography>
      ) : null}
      <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
        {labels.quotaLabel(row.classesRemaining ?? 0, row.classesTotal ?? 0)}
      </Typography>
      <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
        {labels.hoursLabel(Number(row.hoursPerWeek ?? 0))}
      </Typography>
    </Box>
  );
}

export function ParentStudentsMobileView({ labels, loading, error, rows }: Readonly<ParentStudentsViewModel>) {
  return (
    <MobilePageContainer>
      <MobilePageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : null}
      {error ? (
        <Typography sx={{ color: theme => theme.palette.error.main }}>{labels.errors.failedToLoad}</Typography>
      ) : null}
      {!loading && !error ? (
        <Stack spacing={1}>
          {rows.length === 0 ? (
            <Typography sx={{ color: theme => theme.palette.text.secondary }}>{labels.noStudents}</Typography>
          ) : (
            rows.map(row => <ParentStudentMobileCard key={row.id} row={row} labels={labels} />)
          )}
        </Stack>
      ) : null}
    </MobilePageContainer>
  );
}

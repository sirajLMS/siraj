"use client";

import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import type { TeacherStudentsViewModel } from "@/frontend/common/views/dashboard/teachers/students/useTeacherStudentsViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";

type StudentRow = TeacherStudentsViewModel["rows"][number];

function StudentRowCard({
  row,
  labels,
}: {
  readonly row: StudentRow;
  readonly labels: TeacherStudentsViewModel["labels"];
}) {
  return (
    <Box
      sx={theme => ({
        p: 2,
        borderRadius: 1,
        border: `1px solid ${theme.palette.border.light}`,
        backgroundColor: theme.palette.surfaceContainerLowest,
      })}
    >
      <Typography sx={{ typography: "titleLg", fontWeight: 600 }}>{row.name}</Typography>
      <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
        {labels.statusLabel(row.status ?? "")}
      </Typography>
      <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
        {labels.quotaLabel(row.classesRemaining ?? 0, row.classesTotal ?? 0)}
      </Typography>
      <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
        {labels.hoursLabel(row.hoursPerWeek ?? 0)}
      </Typography>
    </Box>
  );
}

/**
 * Desktop variant of the Teacher Students view. Renders a vertical `Stack` of
 * outlined `Box` rows mirroring the original container layout.
 */
export function TeacherStudentsDesktopView({ rows, loading, error, labels }: Readonly<TeacherStudentsViewModel>) {
  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : null}
      {error ? <Typography sx={{ color: theme => theme.palette.error.main }}>{labels.failedToLoad}</Typography> : null}
      {!loading && !error ? (
        <Stack spacing={1}>
          {rows.length === 0 ? (
            <Typography sx={{ color: theme => theme.palette.text.secondary }}>{labels.noStudents}</Typography>
          ) : (
            rows.map(row => <StudentRowCard key={row.id ?? row.name ?? ""} row={row} labels={labels} />)
          )}
        </Stack>
      ) : null}
    </DesktopPageContainer>
  );
}

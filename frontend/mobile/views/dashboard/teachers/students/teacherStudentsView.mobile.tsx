"use client";

import { Box, CircularProgress, Typography } from "@mui/material";
import type { TeacherStudentsViewModel } from "@/frontend/common/views/dashboard/teachers/students/useTeacherStudentsViewModel";
import {
  MobileCardList,
  MobileCardListItem,
  MobilePageContainer,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";

type StudentRow = TeacherStudentsViewModel["rows"][number];

function StudentCard({
  row,
  labels,
}: {
  readonly row: StudentRow;
  readonly labels: TeacherStudentsViewModel["labels"];
}) {
  return (
    <MobileCardListItem>
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
    </MobileCardListItem>
  );
}

/**
 * Mobile variant of the Teacher Students view. Uses `MobileCardList` + edge-
 * to-edge `MobileCardListItem` for each assigned student row.
 */
export function TeacherStudentsMobileView({ rows, loading, error, labels }: Readonly<TeacherStudentsViewModel>) {
  return (
    <MobilePageContainer>
      <MobilePageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : null}
      {error ? <Typography sx={{ color: theme => theme.palette.error.main }}>{labels.failedToLoad}</Typography> : null}
      {!loading && !error ? (
        <MobileCardList
          rows={rows}
          getKey={row => row.id ?? String(row.name ?? "")}
          renderItem={row => <StudentCard row={row} labels={labels} />}
          emptyMessage={labels.noStudents}
          paginationOptions={{ mode: "client" }}
        />
      ) : null}
    </MobilePageContainer>
  );
}

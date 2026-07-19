"use client";

import { Stack, Typography } from "@mui/material";
import type {
  ParentStudentRow,
  ParentStudentsViewModel,
} from "@/frontend/common/views/dashboard/parent/students/useParentStudentsViewModel";
import {
  MobileCardList,
  MobileCardListItem,
  MobilePageContainer,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";

function ParentStudentMobileCard({
  row,
  labels,
}: {
  readonly row: ParentStudentRow;
  readonly labels: ParentStudentsViewModel["labels"];
}) {
  return (
    <MobileCardListItem variant="edge-to-edge">
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
    </MobileCardListItem>
  );
}

export function ParentStudentsMobileView({ labels, loading, error, rows }: Readonly<ParentStudentsViewModel>) {
  return (
    <MobilePageContainer>
      <MobilePageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />
      {error ? (
        <Typography sx={{ color: theme => theme.palette.error.main }}>{labels.errors.failedToLoad}</Typography>
      ) : null}
      {!error ? (
        <Stack spacing={1}>
          <MobileCardList
            rows={rows}
            loading={loading}
            emptyMessage={labels.noStudents}
            getKey={row => row.id}
            paginationOptions={{ mode: "client" }}
            layout="edge-to-edge"
            renderItem={row => <ParentStudentMobileCard row={row} labels={labels} />}
          />
        </Stack>
      ) : null}
    </MobilePageContainer>
  );
}

"use client";

import { Typography } from "@mui/material";
import type { FC, ReactNode } from "react";
import { ErrorState, LoadingState } from "@/frontend/common/components/ui";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { TeacherStudentsViewModel } from "@/frontend/common/views/dashboard/teachers/students/useTeacherStudentsViewModel";

type StudentRow = TeacherStudentsViewModel["rows"][number];
type StudentLabels = TeacherStudentsViewModel["labels"];

export interface TeacherStudentsViewSharedListProps {
  readonly rows: readonly StudentRow[];
  readonly labels: StudentLabels;
  readonly emptyMessage: string;
  readonly getKey: (row: StudentRow) => string;
  readonly paginationOptions: ListPaginationOptions;
}

export interface TeacherStudentsViewSharedSlots {
  readonly PageContainer: FC<Readonly<{ children: ReactNode }>>;
  readonly PageHeader: FC<Readonly<{ title: string; subtitle: string }>>;
  readonly RowWrapper?: FC<Readonly<{ children: ReactNode }>>;
  readonly ListWrapper: FC<Readonly<TeacherStudentsViewSharedListProps>>;
}

function StudentRowContent({ row, labels }: Readonly<{ row: StudentRow; labels: StudentLabels }>) {
  return (
    <>
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
    </>
  );
}

export function StudentRowCardShared({
  row,
  labels,
  RowWrapper,
}: Readonly<{
  row: StudentRow;
  labels: StudentLabels;
  RowWrapper: FC<Readonly<{ children: ReactNode }>>;
}>) {
  return (
    <RowWrapper>
      <StudentRowContent row={row} labels={labels} />
    </RowWrapper>
  );
}

export function TeacherStudentsViewShared({
  rows,
  loading,
  error,
  labels,
  paginationOptions,
  slots,
}: Readonly<TeacherStudentsViewModel> & {
  readonly slots: TeacherStudentsViewSharedSlots;
}) {
  const { PageContainer, PageHeader, ListWrapper } = slots;

  return (
    <PageContainer>
      <PageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState embedded message={labels.failedToLoad} /> : null}
      {!loading && !error ? (
        <ListWrapper
          rows={rows}
          labels={labels}
          emptyMessage={labels.noStudents}
          getKey={row => row.id ?? row.name ?? ""}
          paginationOptions={paginationOptions}
        />
      ) : null}
    </PageContainer>
  );
}

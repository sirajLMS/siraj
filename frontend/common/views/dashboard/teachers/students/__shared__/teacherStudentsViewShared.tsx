"use client";

import { Stack, Typography } from "@mui/material";
import type { FC, ReactNode } from "react";
import { LoadingState } from "@/frontend/common/components/ui";
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
  readonly RowWrapper: FC<Readonly<{ children: ReactNode }>>;
  readonly ListWrapper?: FC<Readonly<TeacherStudentsViewSharedListProps>>;
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
  RowWrapper: TeacherStudentsViewSharedSlots["RowWrapper"];
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
  slots,
}: Readonly<TeacherStudentsViewModel> & {
  readonly slots: TeacherStudentsViewSharedSlots;
}) {
  const { PageContainer, PageHeader, RowWrapper, ListWrapper } = slots;

  const renderBody = () => {
    if (rows.length === 0) {
      return <Typography sx={{ color: theme => theme.palette.text.secondary }}>{labels.noStudents}</Typography>;
    }

    if (ListWrapper) {
      return (
        <ListWrapper
          rows={rows}
          labels={labels}
          emptyMessage={labels.noStudents}
          getKey={row => row.id ?? row.name ?? ""}
          paginationOptions={{ mode: "client" }}
        />
      );
    }

    return (
      <Stack spacing={1}>
        {rows.map((row: StudentRow) => {
          const key = row.id ?? row.name ?? "";
          return <StudentRowCardShared key={key} row={row} labels={labels} RowWrapper={RowWrapper} />;
        })}
      </Stack>
    );
  };

  return (
    <PageContainer>
      <PageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />
      {loading ? <LoadingState /> : null}
      {error ? <Typography sx={{ color: theme => theme.palette.error.main }}>{labels.failedToLoad}</Typography> : null}
      {!loading && !error ? renderBody() : null}
    </PageContainer>
  );
}

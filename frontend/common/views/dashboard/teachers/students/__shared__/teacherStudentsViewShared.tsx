"use client";

import { Typography } from "@mui/material";
import type { FC, ReactNode } from "react";
import { ErrorState, LoadingState } from "@/frontend/common/components/ui";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { studentHref } from "@/frontend/common/utils/profileHref";
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

/**
 * Props the shared student row hands to the tier-provided profile-link slot.
 * Mirrors the `href` + `name` + `fallbackInitial` surface of the tier
 * `PersonProfileLink` primitives without depending on a tier component.
 */
interface StudentRowProfileLinkSlotProps {
  readonly href?: string;
  readonly name: string;
  readonly fallbackInitial?: string;
}

/**
 * Props the shared student row hands to the tier-provided status-badge slot.
 * The category is fixed to `studentAccount` because every row is a student
 * account; only the raw status and the localized label vary per row.
 */
interface StudentRowStatusBadgeSlotProps {
  readonly category: "studentAccount";
  readonly status: string;
  readonly label: string;
}

export interface StudentRowContentSlots {
  readonly PersonProfileLink: FC<Readonly<StudentRowProfileLinkSlotProps>>;
  readonly StatusBadge: FC<Readonly<StudentRowStatusBadgeSlotProps>>;
}

function StudentRowContent({
  row,
  labels,
  PersonProfileLink,
  StatusBadge,
}: Readonly<{ row: StudentRow; labels: StudentLabels } & StudentRowContentSlots>) {
  return (
    <>
      <PersonProfileLink href={row.id ? studentHref(row.id) : undefined} name={row.name ?? ""} fallbackInitial="S" />
      <StatusBadge
        category="studentAccount"
        status={(row.status ?? "").toLowerCase()}
        label={labels.statusLabel(row.status ?? "")}
      />
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
  PersonProfileLink,
  StatusBadge,
}: Readonly<
  {
    row: StudentRow;
    labels: StudentLabels;
    RowWrapper: FC<Readonly<{ children: ReactNode }>>;
  } & StudentRowContentSlots
>) {
  return (
    <RowWrapper>
      <StudentRowContent row={row} labels={labels} PersonProfileLink={PersonProfileLink} StatusBadge={StatusBadge} />
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

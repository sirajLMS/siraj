"use client";

import { Alert, Box, Button, Chip, Skeleton, Stack, Typography } from "@mui/material";
import type { GridPaginationModel } from "@mui/x-data-grid";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { PaginationControls } from "@/frontend/components/ui";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";
import { AssignedStudentsCardList } from "./AssignedStudentsCardList";
import { AssignedStudentsDataGrid, type AssignedStudentsRow } from "./AssignedStudentsDataGrid";

type AssignedStudentsResult = NonNullable<Operations.ProfileByUserIdQuery["profileByUserId"]>["assignedStudents"];
type AssignedStudentsItem = NonNullable<NonNullable<AssignedStudentsResult>["rows"]>[number];

type AssignedStudentsTabProps = {
  readonly assignedStudents: AssignedStudentsResult | null | undefined;
  readonly loading: boolean;
  readonly hasError: boolean;
  readonly onRetry: () => void;
};

function toViewRow(
  student: AssignedStudentsItem,
  t: ReturnType<typeof useTranslations<"profile.students">>
): AssignedStudentsRow {
  const classesTotal = student.classesTotal ?? 0;
  const classesRemaining = student.classesRemaining ?? 0;
  const hoursPerWeek = student.hoursPerWeek ?? 0;

  return {
    id: student.id ?? "",
    studentName: student.name ?? "",
    studentAvatarUrl: student.studentAvatarUrl ?? null,
    parentName: student.parentName?.trim() || t("parentUnknown"),
    parentAvatarUrl: student.parentAvatarUrl ?? null,
    className: student.className?.trim() || t("classUnknown"),
    status: student.status ?? "UNKNOWN",
    hoursPerWeek,
    classesRemaining,
    classesTotal,
  };
}

function LoadingState() {
  return (
    <Stack spacing={1.5}>
      <Skeleton variant="rounded" height={36} />
      <Skeleton variant="rounded" height={420} />
    </Stack>
  );
}

export function AssignedStudentsTab({ assignedStudents, loading, hasError, onRetry }: AssignedStudentsTabProps) {
  const t = useTranslations("profile.students");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const rows = useMemo(() => {
    const sourceRows = assignedStudents?.rows ?? [];
    return sourceRows
      .filter((student): student is AssignedStudentsItem => Boolean(student?.id && student?.name))
      .map(student => toViewRow(student, t));
  }, [assignedStudents?.rows, t]);

  const classOptions = useMemo(() => {
    const options = Array.from(
      new Set(
        rows
          .map(row => row.className)
          .filter(className => className !== t("classUnknown"))
          .sort((a, b) => a.localeCompare(b))
      )
    );
    return [t("allClasses"), ...options];
  }, [rows, t]);

  const filteredRows = useMemo(() => {
    if (selectedClass === "all") {
      return rows;
    }
    return rows.filter(row => row.className === selectedClass);
  }, [rows, selectedClass]);

  const totalCount = filteredRows.length;
  const pagedRows = filteredRows.slice(page * pageSize, (page + 1) * pageSize);

  const handleClassChange = (className: string) => {
    setSelectedClass(className === t("allClasses") ? "all" : className);
    setPage(0);
  };

  const handlePaginationModelChange = (model: GridPaginationModel) => {
    setPage(model.page);
    setPageSize(model.pageSize);
  };

  if (loading && !assignedStudents) {
    return <LoadingState />;
  }

  if (hasError) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={onRetry}>
            {t("errors.retry")}
          </Button>
        }
      >
        {t("errors.failedToLoad")}
      </Alert>
    );
  }

  if (!assignedStudents || rows.length === 0) {
    return (
      <Stack spacing={1}>
        <Typography sx={{ typography: "titleLg" }}>{t("empty.title")}</Typography>
        <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
          {t("empty.description")}
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Stack spacing={0.5}>
        <Typography sx={{ typography: "titleLg" }}>{t("title")}</Typography>
        <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
          {t("description")}
        </Typography>
      </Stack>

      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
        {classOptions.map(className => {
          const isActive = (className === t("allClasses") && selectedClass === "all") || selectedClass === className;
          return (
            <Chip
              key={className}
              label={className}
              clickable
              variant={isActive ? "filled" : "outlined"}
              onClick={() => {
                handleClassChange(className);
              }}
            />
          );
        })}
      </Stack>

      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <AssignedStudentsDataGrid
          rows={filteredRows}
          loading={loading}
          page={page}
          pageSize={pageSize}
          onPaginationModelChange={handlePaginationModelChange}
        />
      </Box>
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <AssignedStudentsCardList rows={pagedRows} />
        <PaginationControls
          embedded
          page={page}
          pageCount={pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0}
          rowCount={totalCount}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </Box>
    </Stack>
  );
}

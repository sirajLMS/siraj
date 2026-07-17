"use client";

import { Alert, Button, Chip, Skeleton, Stack, Typography } from "@mui/material";
import type { AssignedStudentsTabViewModel } from "@/frontend/common/views/dashboard/profile/teacher/students/assignedStudentsTabTypes";
import { MobilePaginationControls } from "@/frontend/mobile/components/ui/filter";
import { AssignedStudentsCardList } from "@/frontend/mobile/views/dashboard/profile/teacher/students/assignedStudentsCardList.mobile";

function LoadingState() {
  return (
    <Stack spacing={1.5}>
      <Skeleton variant="rounded" height={36} />
      <Skeleton variant="rounded" height={420} />
    </Stack>
  );
}

export function AssignedStudentsTabMobileView({
  title,
  description,
  rows,
  loading,
  hasError,
  retryLabel,
  errorLabel,
  onRetry,
  empty,
  classFilter,
  pagination,
}: Readonly<AssignedStudentsTabViewModel>) {
  if (loading && rows.length === 0) {
    return <LoadingState />;
  }

  if (hasError) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={onRetry}>
            {retryLabel}
          </Button>
        }
      >
        {errorLabel}
      </Alert>
    );
  }

  if (rows.length === 0) {
    return (
      <Stack spacing={1}>
        <Typography sx={{ typography: "titleLg" }}>{empty.title}</Typography>
        <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
          {empty.description}
        </Typography>
      </Stack>
    );
  }

  const { page, pageSize, totalCount, onPageChange } = pagination;
  const pagedRows = rows.slice(page * pageSize, (page + 1) * pageSize);
  const pageCount = pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0;

  return (
    <Stack spacing={2}>
      <Stack spacing={0.5}>
        <Typography sx={{ typography: "titleLg" }}>{title}</Typography>
        <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
          {description}
        </Typography>
      </Stack>

      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
        {classFilter.options.map(className => {
          const isActive =
            (className === classFilter.allClassesLabel && classFilter.selected === "all") ||
            classFilter.selected === className;
          return (
            <Chip
              key={className}
              label={className}
              clickable
              variant={isActive ? "filled" : "outlined"}
              onClick={() => {
                classFilter.onSelect(className);
              }}
            />
          );
        })}
      </Stack>

      <AssignedStudentsCardList rows={pagedRows} />

      <MobilePaginationControls
        embedded
        page={page}
        pageCount={pageCount}
        rowCount={totalCount}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </Stack>
  );
}

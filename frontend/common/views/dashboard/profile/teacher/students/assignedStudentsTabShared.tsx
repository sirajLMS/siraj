"use client";

import { Alert, Button, Chip, Skeleton, Stack, Typography } from "@mui/material";
import type { AssignedStudentsTabViewModel } from "@/frontend/common/views/dashboard/profile/teacher/students/assignedStudentsTabTypes";
import type { AssignedStudentsTabSlotProps } from "@/frontend/common/views/dashboard/profile/teacher/students/types/assignedStudentsTabShared.types";

function LoadingState() {
  return (
    <Stack spacing={1.5}>
      <Skeleton variant="rounded" height={36} />
      <Skeleton variant="rounded" height={420} />
    </Stack>
  );
}

function EmptyState({ empty }: Readonly<{ empty: AssignedStudentsTabViewModel["empty"] }>) {
  return (
    <Stack spacing={1}>
      <Typography sx={{ typography: "titleLg" }}>{empty.title}</Typography>
      <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
        {empty.description}
      </Typography>
    </Stack>
  );
}

function ErrorState({
  errorLabel,
  retryLabel,
  onRetry,
}: Readonly<Pick<AssignedStudentsTabViewModel, "errorLabel" | "retryLabel" | "onRetry">>) {
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

function ClassFilterRow({
  classFilter,
  ClassFilterWrapper,
}: Readonly<{
  classFilter: AssignedStudentsTabViewModel["classFilter"];
  ClassFilterWrapper?: AssignedStudentsTabSlotProps["ClassFilterWrapper"];
}>) {
  const chips = classFilter.options.map(className => {
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
        sx={{ flexShrink: 0 }}
      />
    );
  });

  if (ClassFilterWrapper) {
    return <ClassFilterWrapper>{chips}</ClassFilterWrapper>;
  }

  return (
    <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
      {chips}
    </Stack>
  );
}

export interface AssignedStudentsTabSharedProps {
  readonly viewModel: Readonly<AssignedStudentsTabViewModel>;
  readonly slots: AssignedStudentsTabSlotProps;
}

export function AssignedStudentsTabShared({ viewModel, slots }: Readonly<AssignedStudentsTabSharedProps>) {
  const {
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
  } = viewModel;
  const { ListView, ClassFilterWrapper } = slots;

  if (loading && rows.length === 0) {
    return <LoadingState />;
  }

  if (hasError) {
    return <ErrorState errorLabel={errorLabel} retryLabel={retryLabel} onRetry={onRetry} />;
  }

  if (rows.length === 0) {
    return <EmptyState empty={empty} />;
  }

  return (
    <Stack spacing={2}>
      <Stack spacing={0.5}>
        <Typography sx={{ typography: "titleLg" }}>{title}</Typography>
        <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
          {description}
        </Typography>
      </Stack>

      <ClassFilterRow classFilter={classFilter} ClassFilterWrapper={ClassFilterWrapper} />

      <ListView rows={rows} loading={loading} pagination={pagination} />
    </Stack>
  );
}

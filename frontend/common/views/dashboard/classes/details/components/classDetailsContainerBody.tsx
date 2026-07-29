"use client";

import { Box } from "@mui/material";
import { ErrorState } from "@/frontend/common/components/ui/state/ErrorState";
import { LoadingState } from "@/frontend/common/components/ui/state/LoadingState";
import type { ClassDetailsContainerBodyProps } from "@/frontend/common/views/dashboard/classes/details/components/types/classDetailsContainerShared.types";
import type { InvalidIdStateProps } from "@/frontend/common/views/dashboard/classes/details/types";

function InvalidIdState({ t }: Readonly<InvalidIdStateProps>) {
  return (
    <Box sx={theme => ({ p: 3, textAlign: "center", color: theme.palette.onSurfaceVariant })}>{t.invalidClassId}</Box>
  );
}

export function ClassDetailsContainerBody({ viewModel, slots }: Readonly<ClassDetailsContainerBodyProps>) {
  const { status, t } = viewModel;
  const { PageContainer, ClassDetailsContent } = slots;

  if (status === "loading") {
    return <LoadingState />;
  }

  if (status === "invalidId") {
    return <InvalidIdState t={t} />;
  }

  if (status === "error" || !viewModel.instance) {
    return <ErrorState message={t.loadError} />;
  }

  return (
    <PageContainer>
      <ClassDetailsContent
        instance={viewModel.instance}
        canOverride={viewModel.canOverride}
        isParentView={viewModel.isParentView}
        isStudentView={viewModel.isStudentView}
        canViewSessionDetails={viewModel.canViewSessionDetails}
        isWarningDismissed={viewModel.isWarningDismissed}
        onDismissWarning={() => viewModel.setIsWarningDismissed(true)}
        handlers={viewModel.handlers}
        sessionActionProps={viewModel.sessionActionProps}
        feedbackState={viewModel.feedbackState}
        deleteDialogOpen={viewModel.deleteDialogOpen}
        onCloseDeleteDialog={() => viewModel.setDeleteDialogOpen(false)}
        onConfirmDelete={viewModel.handlers.handleDeleteConfirm}
        t={viewModel.t}
        headerLabels={viewModel.headerLabels}
        formattedScheduledDate={viewModel.formattedScheduledDate}
        formattedStartTime={viewModel.formattedStartTime}
        formattedEndTime={viewModel.formattedEndTime}
      />
    </PageContainer>
  );
}

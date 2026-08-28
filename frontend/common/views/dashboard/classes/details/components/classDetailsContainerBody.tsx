"use client";

import { ErrorState, LoadingState } from "@/frontend/common/components/ui";
import type { ClassDetailsContainerBodyProps } from "@/frontend/common/views/dashboard/classes/details/components/types/classDetailsContainerShared.types";

export function ClassDetailsContainerBody({ viewModel, slots }: Readonly<ClassDetailsContainerBodyProps>) {
  const { status, t } = viewModel;
  const { PageContainer, ClassDetailsContent } = slots;

  if (status === "loading") {
    return <LoadingState />;
  }

  if (status === "invalidId") {
    return <ErrorState embedded message={t.invalidClassId} />;
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
        onOpenDeleteDialog={() => viewModel.setDeleteDialogOpen(true)}
        onCloseDeleteDialog={() => viewModel.setDeleteDialogOpen(false)}
        onConfirmDelete={viewModel.handlers.handleDeleteConfirm}
        onGenerateLog={viewModel.onGenerateLog}
        overrideRateDialog={viewModel.overrideRateDialog}
        t={viewModel.t}
        headerLabels={viewModel.headerLabels}
        formattedScheduledDate={viewModel.formattedScheduledDate}
        formattedStartTime={viewModel.formattedStartTime}
        formattedEndTime={viewModel.formattedEndTime}
      />
    </PageContainer>
  );
}

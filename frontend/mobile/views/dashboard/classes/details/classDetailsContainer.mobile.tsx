"use client";

import { Box } from "@mui/material";
import { PageContainer } from "@/frontend/common/components/ui";
import { ErrorState } from "@/frontend/common/components/ui/state/ErrorState";
import { LoadingState } from "@/frontend/common/components/ui/state/LoadingState";
import type { ClassDetailsViewModel } from "@/frontend/common/views/dashboard/classes/details/hooks/useClassDetailsViewModel";
import { ClassDetailsContentMobile } from "@/frontend/mobile/views/dashboard/classes/details/components/classDetailsContent.mobile";

interface InvalidIdStateProps {
  readonly t: ClassDetailsViewModel["t"];
}

function InvalidIdState({ t }: InvalidIdStateProps) {
  return (
    <Box sx={theme => ({ p: 3, textAlign: "center", color: theme.palette.onSurfaceVariant })}>{t.invalidClassId}</Box>
  );
}

export function ClassDetailsContainerMobile({ viewModel }: { readonly viewModel: ClassDetailsViewModel }) {
  const { status, t } = viewModel;

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
      <ClassDetailsContentMobile
        instance={viewModel.instance}
        canOverride={viewModel.canOverride}
        isParentView={viewModel.isParentView}
        isWarningDismissed={viewModel.isWarningDismissed}
        onDismissWarning={() => viewModel.setIsWarningDismissed(true)}
        handlers={viewModel.handlers}
        sessionActionProps={viewModel.sessionActionProps}
        feedbackState={viewModel.feedbackState}
        deleteDialogOpen={viewModel.deleteDialogOpen}
        onCloseDeleteDialog={() => viewModel.setDeleteDialogOpen(false)}
        onConfirmDelete={viewModel.handlers.handleDeleteConfirm}
        t={viewModel.t}
        formattedScheduledDate={viewModel.formattedScheduledDate}
        formattedStartTime={viewModel.formattedStartTime}
        formattedEndTime={viewModel.formattedEndTime}
      />
    </PageContainer>
  );
}

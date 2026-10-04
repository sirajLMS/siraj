// cspell:disable
"use client";

import { Box, Stack, Typography } from "@mui/material";
import { ActionButtons } from "@/frontend/common/views/dashboard/teachers/reassignment/components/managementControlsCardActions.parts";
import {
  StatusUpdate,
  TeacherSelection,
} from "@/frontend/common/views/dashboard/teachers/reassignment/components/managementControlsCardFields.parts";
import type { ManagementControlsCardProps } from "@/frontend/common/views/dashboard/teachers/reassignment/types";
import type { ManagementControlsCardSlotProps } from "@/frontend/common/views/dashboard/teachers/reassignment/types/managementControlsCardShared.types";

export interface ManagementControlsCardSharedProps {
  readonly props: Readonly<ManagementControlsCardProps>;
  readonly slots: ManagementControlsCardSlotProps;
}

export function ManagementControlsCardShared({ props, slots }: Readonly<ManagementControlsCardSharedProps>) {
  const {
    currentStatus,
    isSubmitting,
    onCancel,
    selectedTeacherId,
    selectedNewStatus,
    saved,
    onSelectedTeacherIdChange,
    onSelectedNewStatusChange,
    onSubmitForm,
    labels,
    statusLabelId,
  } = props;
  const { CardContainer, StatusBadge, TeacherAutocomplete, CancelAction, SubmitAction } = slots;

  return (
    <CardContainer sx={{ p: 3, boxShadow: theme => theme.palette.shadow.card }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700, mb: 0.5 })}>
          {labels.controls.title}
        </Typography>
        <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {labels.controls.subtitle}
        </Typography>
      </Box>

      <Stack component="form" spacing={3} onSubmit={onSubmitForm}>
        <TeacherSelection
          selectedTeacherId={selectedTeacherId}
          onTeacherChange={onSelectedTeacherIdChange}
          labels={labels.controls}
          TeacherAutocomplete={TeacherAutocomplete}
        />
        <StatusUpdate
          currentStatus={currentStatus}
          selectedStatus={selectedNewStatus}
          onStatusChange={onSelectedNewStatusChange}
          labels={labels.controls}
          statusLabelId={statusLabelId}
          StatusBadge={StatusBadge}
        />
        <ActionButtons
          loading={isSubmitting}
          saved={saved}
          onCancel={onCancel}
          labels={labels.actions}
          CancelAction={CancelAction}
          SubmitAction={SubmitAction}
        />
      </Stack>
    </CardContainer>
  );
}

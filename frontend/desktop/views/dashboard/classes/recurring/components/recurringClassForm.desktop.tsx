"use client";

import { AddOutlined, CheckCircleOutlined } from "@mui/icons-material";
import { Alert, alpha, Box, Button, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { BaseRecurringClassFormProps } from "@/frontend/common/views/dashboard/classes/recurring/types";
import { RecurringClassFormFieldsDesktop } from "@/frontend/desktop/views/dashboard/classes/recurring/components/recurringClassFormFields.desktop";

const StyledScrollableFormBody = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: "auto",
  p: 3,
  "&::-webkit-scrollbar": { width: 4 },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: theme.palette.divider,
    borderRadius: 2,
  },
}));

const StyledFormFooter = styled(Box)(({ theme }) => ({
  p: 3,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  borderTop: 1,
  borderColor: theme.palette.divider,
  backgroundColor: alpha(theme.palette.background.default, 0.5),
}));

const StyledSubmitButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.sidebar,
  color: theme.palette.onSidebar,
  borderRadius: 10,
  px: 5,
  py: 1.5,
  typography: "labelUppercase",
  boxShadow: theme.palette.shadow.button,
  "&:hover": {
    backgroundColor: theme.palette.sidebar,
    filter: "brightness(1.1)",
  },
}));

const StyledSuccessBadge = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: 1.5,
  px: 2,
  py: 1,
  borderRadius: 2,
  backgroundColor: theme.palette.status.activeContainer,
  color: theme.palette.sidebar,
  border: 1,
  borderColor: theme.palette.status.active,
}));

// VARIANT JUSTIFICATION: Desktop tier renders an inline success badge after
// submission. Mobile delegates the success UI to the Container-level snackbar
// via the ViewModel (per specs.md §4.1 — Class-C variant).
export interface RecurringClassFormDesktopProps extends BaseRecurringClassFormProps {
  readonly showSuccess: boolean;
}

export function RecurringClassFormDesktop({
  register,
  errors,
  watch,
  setValue,
  control,
  handleSubmit,
  isSubmitting,
  showSuccess,
  meetingConfigWarning = false,
  meetingConfigWarningMessage,
  goToClassLabel,
  onGoToCreatedClass,
  formLabels,
  onSubmit,
  meetingConfig,
  onMeetingConfigChangeAction,
  students,
  teachers,
  studentsLoading,
  teachersLoading,
}: RecurringClassFormDesktopProps) {
  return (
    <Box
      component="form"
      onSubmit={e => {
        e.preventDefault();
        handleSubmit(onSubmit)(e);
      }}
      sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
    >
      <StyledScrollableFormBody>
        <RecurringClassFormFieldsDesktop
          register={register}
          errors={errors}
          watch={watch}
          setValue={setValue}
          control={control}
          isSubmitting={isSubmitting}
          labels={formLabels}
          meetingConfig={meetingConfig}
          onMeetingConfigChangeAction={onMeetingConfigChangeAction}
          students={students}
          teachers={teachers}
          studentsLoading={studentsLoading}
          teachersLoading={teachersLoading}
        />
      </StyledScrollableFormBody>

      <StyledFormFooter>
        {meetingConfigWarning && meetingConfigWarningMessage ? (
          <Alert
            severity="warning"
            sx={{ mb: 2, width: "100%" }}
            action={
              onGoToCreatedClass && goToClassLabel ? (
                <Button color="inherit" size="small" onClick={onGoToCreatedClass}>
                  {goToClassLabel}
                </Button>
              ) : undefined
            }
          >
            {meetingConfigWarningMessage}
          </Alert>
        ) : null}
        <StyledSubmitButton type="submit" variant="contained" disabled={isSubmitting} startIcon={<AddOutlined />}>
          {formLabels.add}
        </StyledSubmitButton>

        {showSuccess && (
          <StyledSuccessBadge>
            <CheckCircleOutlined sx={{ fontSize: 20 }} />
            <Typography variant="bodyMd" sx={{ fontWeight: 600 }}>
              {formLabels.addedSuccessfully}
            </Typography>
          </StyledSuccessBadge>
        )}
      </StyledFormFooter>
    </Box>
  );
}

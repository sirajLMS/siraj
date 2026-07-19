"use client";

import { CheckCircleOutlined } from "@mui/icons-material";
import { Alert, Box, Button, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { BaseRecurringClassFormProps } from "@/frontend/common/views/dashboard/classes/recurring/types";
import { RecurringClassFormFieldsDesktop } from "@/frontend/desktop/views/dashboard/classes/recurring/components/recurringClassFormFields.desktop";

const StyledScrollableFormBody = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: "auto",
  padding: theme.spacing(3),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
  "&::-webkit-scrollbar": { width: 4 },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: theme.palette.divider,
    borderRadius: 2,
  },
}));

const StyledFormActions = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: theme.spacing(2),
}));

const StyledSubmitRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: theme.spacing(2),
  flexWrap: "wrap",
  width: "100%",
}));

const StyledSubmitButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.onPrimary,
  borderRadius: 10,
  px: 5,
  py: 1.5,
  typography: "labelUppercase",
  boxShadow: theme.palette.shadow.button,
  "&:hover": {
    backgroundColor: theme.palette.primary.main,
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
  color: theme.palette.status.active,
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

        <StyledFormActions>
          {meetingConfigWarning && meetingConfigWarningMessage ? (
            <Alert
              severity="warning"
              sx={{ width: "100%" }}
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
          <StyledSubmitRow>
            <StyledSubmitButton type="submit" variant="contained" disabled={isSubmitting}>
              {formLabels.addClass}
            </StyledSubmitButton>

            {showSuccess && (
              <StyledSuccessBadge>
                <CheckCircleOutlined sx={{ fontSize: 20 }} />
                <Typography variant="bodyMd" sx={{ fontWeight: 600 }}>
                  {formLabels.addedSuccessfully}
                </Typography>
              </StyledSuccessBadge>
            )}
          </StyledSubmitRow>
        </StyledFormActions>
      </StyledScrollableFormBody>
    </Box>
  );
}

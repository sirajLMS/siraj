"use client";

import { Alert, Box, Button } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { BaseRecurringClassFormProps } from "@/frontend/common/views/dashboard/classes/recurring/types";
import { RecurringClassFormFieldsMobile } from "@/frontend/mobile/views/dashboard/classes/recurring/components/recurringClassFormFields.mobile";

const StyledScrollableFormBody = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: "auto",
  padding: theme.spacing(2),
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
  alignItems: "stretch",
  gap: theme.spacing(2),
}));

const StyledSubmitButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.onPrimary,
  borderRadius: 10,
  px: 4,
  py: 1.75,
  typography: "labelUppercase",
  boxShadow: theme.palette.shadow.button,
  "&:hover": {
    backgroundColor: theme.palette.primary.main,
    filter: "brightness(1.1)",
  },
  maxWidth: 480,
  alignSelf: "center",
  width: "100%",
}));

// VARIANT JUSTIFICATION: Mobile tier does not render the success badge inline
// (snackbar handled by Container-level ViewModel). Desktop variant adds the
// `showSuccess` field for inline badge display (per specs.md §4.1 — Class-C
// variant: structural/visual divergence between tiers is documented here).
// The mobile interface intentionally mirrors the base shape with no additions;
// we keep it as a named type (rather than aliasing `BaseRecurringClassFormProps`
// directly) so future mobile-only rendering additions land here without
// touching call sites.
export type RecurringClassFormMobileProps = BaseRecurringClassFormProps;

export function RecurringClassFormMobile({
  register,
  errors,
  watch,
  setValue,
  control,
  handleSubmit,
  isSubmitting,
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
}: RecurringClassFormMobileProps) {
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
        <RecurringClassFormFieldsMobile
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
          <StyledSubmitButton type="submit" variant="contained" disabled={isSubmitting} fullWidth>
            {formLabels.addClass}
          </StyledSubmitButton>
        </StyledFormActions>
      </StyledScrollableFormBody>
    </Box>
  );
}

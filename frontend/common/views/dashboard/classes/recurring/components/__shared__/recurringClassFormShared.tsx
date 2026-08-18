"use client";

import { CheckCircleOutlined } from "@mui/icons-material";
import { Alert, Box, Button, Typography } from "@mui/material";
import { styled, type Theme } from "@mui/material/styles";
import type { ComponentType } from "react";
import type {
  BaseRecurringClassFormProps,
  RecurringClassFormFieldsProps,
} from "@/frontend/common/views/dashboard/classes/recurring/types";

export interface RecurringClassFormSharedOptions {
  readonly scrollableBodyPaddingScale: number;
  readonly formActionsAlignItems: "stretch" | "flex-end";
  readonly submitButtonSx: (theme: Theme) => Record<string, unknown>;
  readonly submitButtonFullWidth: boolean;
  readonly showSuccessBadgeInline: boolean;
  readonly fieldsComponent: ComponentType<RecurringClassFormFieldsProps>;
}

const StyledScrollableFormBody = styled(Box, {
  shouldForwardProp: prop => prop !== "paddingScale",
})<{ paddingScale: number }>(({ theme, paddingScale }) => ({
  flex: 1,
  overflowY: "auto",
  padding: theme.spacing(paddingScale),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
  "&::-webkit-scrollbar": { width: 4 },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: theme.palette.divider,
    borderRadius: 2,
  },
}));

const StyledFormActions = styled(Box, {
  shouldForwardProp: prop => prop !== "actionsAlignItems",
})<{ actionsAlignItems: "stretch" | "flex-end" }>(({ theme, actionsAlignItems }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: actionsAlignItems,
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

const StyledSubmitButton = styled(Button, {
  shouldForwardProp: prop => prop !== "extraSx",
})<{ extraSx: (theme: Theme) => Record<string, unknown> }>(({ theme, extraSx }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.onPrimary,
  borderRadius: theme.shape.borderRadius,
  typography: "labelUppercase",
  boxShadow: theme.palette.shadow.button,
  "&:hover": {
    backgroundColor: theme.palette.primary.main,
    filter: "brightness(1.1)",
  },
  ...extraSx(theme),
}));

export function RecurringClassFormShared({
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
  options,
}: BaseRecurringClassFormProps & {
  readonly showSuccess?: boolean;
  readonly options: RecurringClassFormSharedOptions;
}) {
  const FieldsComponent = options.fieldsComponent;

  return (
    <Box
      component="form"
      onSubmit={e => {
        e.preventDefault();
        void handleSubmit(onSubmit)(e);
      }}
      sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
    >
      <StyledScrollableFormBody paddingScale={options.scrollableBodyPaddingScale}>
        <FieldsComponent
          register={register}
          errors={errors}
          watch={watch}
          setValue={setValue}
          control={control}
          isSubmitting={isSubmitting}
          labels={formLabels}
          meetingConfig={meetingConfig}
          onMeetingConfigChangeAction={onMeetingConfigChangeAction}
        />

        <StyledFormActions actionsAlignItems={options.formActionsAlignItems}>
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
          {options.showSuccessBadgeInline ? (
            <StyledSubmitRow>
              <StyledSubmitButton
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                fullWidth={options.submitButtonFullWidth}
                extraSx={options.submitButtonSx}
              >
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
          ) : (
            <StyledSubmitButton
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              fullWidth={options.submitButtonFullWidth}
              extraSx={options.submitButtonSx}
            >
              {formLabels.addClass}
            </StyledSubmitButton>
          )}
        </StyledFormActions>
      </StyledScrollableFormBody>
    </Box>
  );
}

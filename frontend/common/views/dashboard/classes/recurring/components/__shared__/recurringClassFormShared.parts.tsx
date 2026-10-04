import { CheckCircleOutlined } from "@mui/icons-material";
import { Alert, Button, Typography } from "@mui/material";
import {
  StyledFormActions,
  StyledSubmitButton,
  StyledSubmitRow,
  StyledSuccessBadge,
} from "@/frontend/common/views/dashboard/classes/recurring/components/__shared__/recurringClassFormShared.styled";
import type { RecurringClassFormSharedOptions } from "@/frontend/common/views/dashboard/classes/recurring/components/__shared__/recurringClassFormShared.types";
import type { RecurringClassFormLabels } from "@/frontend/common/views/dashboard/classes/recurring/utils/buildRecurringClassFormLabels";

interface FormActionsSharedProps {
  readonly labels: Pick<RecurringClassFormLabels, "addClass" | "addedSuccessfully">;
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean | undefined;
  readonly meetingConfigWarning: boolean;
  readonly meetingConfigWarningMessage: string | undefined;
  readonly goToClassLabel: string | undefined;
  readonly onGoToCreatedClass: (() => void) | undefined;
  readonly options: RecurringClassFormSharedOptions;
}

export function RecurringClassFormActionsShared({
  labels,
  isSubmitting,
  showSuccess,
  meetingConfigWarning,
  meetingConfigWarningMessage,
  goToClassLabel,
  onGoToCreatedClass,
  options,
}: FormActionsSharedProps) {
  return (
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
            {labels.addClass}
          </StyledSubmitButton>
          {showSuccess && (
            <StyledSuccessBadge>
              <CheckCircleOutlined sx={{ fontSize: 20 }} />
              <Typography variant="bodyMd" sx={{ fontWeight: 600 }}>
                {labels.addedSuccessfully}
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
          {labels.addClass}
        </StyledSubmitButton>
      )}
    </StyledFormActions>
  );
}

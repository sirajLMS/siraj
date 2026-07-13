"use client";

import { AddOutlined, CheckCircleOutlined } from "@mui/icons-material";
import { Alert, alpha, Box, Button, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type {
  Control,
  FieldErrors,
  UseFormHandleSubmit,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { RecurringClassFormFields } from "@/frontend/common/views/dashboard/classes/recurring/RecurringClassFormFields";
import type { RecurringClassFormData } from "@/frontend/common/views/dashboard/classes/recurring/recurringClassSchema";
import type { RecurringMeetingConfigFormState } from "@/frontend/common/views/dashboard/classes/recurring/utils/postCreateRecurringMeetingConfig";
import type { CreateRecurringClassLabels } from "@/shared/messages/types/message";

interface RecurringClassFormProps {
  readonly register: UseFormRegister<RecurringClassFormData>;
  readonly errors: FieldErrors<RecurringClassFormData>;
  readonly watch: UseFormWatch<RecurringClassFormData>;
  readonly setValue: UseFormSetValue<RecurringClassFormData>;
  readonly control: Control<RecurringClassFormData>;
  readonly handleSubmit: UseFormHandleSubmit<RecurringClassFormData>;
  readonly isSubmitting: boolean;
  readonly isMobile: boolean;
  readonly showSuccess: boolean;
  readonly meetingConfigWarning?: boolean;
  readonly meetingConfigWarningMessage?: string;
  readonly goToClassLabel?: string;
  readonly onGoToCreatedClass?: () => void;
  readonly labels: {
    readonly add: string;
    readonly addClass: string;
    readonly addedSuccessfully: string;
    readonly students: string;
    readonly studentsPlaceholder: string;
    readonly teacher: string;
    readonly teacherPlaceholder: string;
    readonly defaultStartTime: string;
    readonly duration: string;
    readonly durationHours: string;
    readonly durationMinutes: string;
    readonly hours: string;
    readonly minutes: string;
    readonly daysSelection: string;
    readonly classSchedule: string;
    readonly weekendOff: string;
    readonly timeOverride: string;
    readonly timezone: string;
    readonly timezonePlaceholder: string;
    readonly classType: string;
    readonly classTypePlaceholder: string;
    readonly days: CreateRecurringClassLabels["days"];
  };
  readonly onSubmit: (data: RecurringClassFormData) => void;
  readonly meetingConfig: RecurringMeetingConfigFormState;
  readonly onMeetingConfigChangeAction: (next: RecurringMeetingConfigFormState) => void;
}

const StyledScrollableFormBody = styled(Box, {
  shouldForwardProp: prop => prop !== "isMobile",
})<{ isMobile: boolean }>(({ theme, isMobile }) => ({
  flex: 1,
  overflowY: "auto",
  p: isMobile ? 2 : 3,
  "&::-webkit-scrollbar": { width: 4 },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: theme.palette.divider,
    borderRadius: 2,
  },
}));

const StyledFormFooter = styled(Box, {
  shouldForwardProp: prop => prop !== "isMobile",
})<{ isMobile: boolean }>(({ theme, isMobile }) => ({
  p: isMobile ? 2 : 3,
  display: "flex",
  alignItems: "center",
  justifyContent: isMobile ? "center" : "space-between",
  borderTop: 1,
  borderColor: theme.palette.divider,
  backgroundColor: alpha(theme.palette.background.default, 0.5),
  ...(isMobile && {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: theme.zIndex.drawer + 2,
    pb: "calc(16px + env(safe-area-inset-bottom))",
  }),
}));

const StyledSubmitButton = styled(Button, {
  shouldForwardProp: prop => prop !== "isMobile",
})<{ isMobile: boolean }>(({ theme, isMobile }) => ({
  backgroundColor: theme.palette.sidebar,
  color: theme.palette.onSidebar,
  borderRadius: 10,
  px: isMobile ? 4 : 5,
  py: isMobile ? 1.75 : 1.5,
  typography: "labelUppercase",
  boxShadow: theme.palette.shadow.button,
  "&:hover": {
    backgroundColor: theme.palette.sidebar,
    filter: "brightness(1.1)",
  },
  maxWidth: isMobile ? 480 : undefined,
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

export function RecurringClassForm({
  register,
  errors,
  watch,
  setValue,
  control,
  handleSubmit,
  isSubmitting,
  isMobile,
  showSuccess,
  meetingConfigWarning = false,
  meetingConfigWarningMessage,
  goToClassLabel,
  onGoToCreatedClass,
  labels,
  onSubmit,
  meetingConfig,
  onMeetingConfigChangeAction,
}: RecurringClassFormProps) {
  return (
    <Box
      component="form"
      onSubmit={e => {
        e.preventDefault();
        handleSubmit(onSubmit)(e);
      }}
      sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
    >
      <StyledScrollableFormBody isMobile={isMobile}>
        <RecurringClassFormFields
          register={register}
          errors={errors}
          watch={watch}
          setValue={setValue}
          control={control}
          isSubmitting={isSubmitting}
          isMobile={isMobile}
          labels={labels}
          meetingConfig={meetingConfig}
          onMeetingConfigChangeAction={onMeetingConfigChangeAction}
        />
      </StyledScrollableFormBody>

      <StyledFormFooter isMobile={isMobile}>
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
        <StyledSubmitButton
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          startIcon={isMobile ? undefined : <AddOutlined />}
          endIcon={isMobile ? <AddOutlined /> : undefined}
          fullWidth={isMobile}
          isMobile={isMobile}
        >
          {isMobile ? labels.addClass : labels.add}
        </StyledSubmitButton>

        {showSuccess && !isMobile && (
          <StyledSuccessBadge>
            <CheckCircleOutlined sx={{ fontSize: 20 }} />
            <Typography variant="bodyMd" sx={{ fontWeight: 600 }}>
              {labels.addedSuccessfully}
            </Typography>
          </StyledSuccessBadge>
        )}
      </StyledFormFooter>
    </Box>
  );
}

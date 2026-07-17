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
import type { RecurringClassFormData } from "@/frontend/common/views/dashboard/classes/recurring/recurringClassSchema";
import type { RecurringMeetingConfigFormState } from "@/frontend/common/views/dashboard/classes/recurring/utils/postCreateRecurringMeetingConfig";
import { RecurringClassFormFieldsDesktop } from "@/frontend/desktop/views/dashboard/classes/recurring/components/recurringClassFormFields.desktop";
import type { CreateRecurringClassLabels } from "@/shared/locale";

interface RecurringClassFormDesktopProps {
  readonly register: UseFormRegister<RecurringClassFormData>;
  readonly errors: FieldErrors<RecurringClassFormData>;
  readonly watch: UseFormWatch<RecurringClassFormData>;
  readonly setValue: UseFormSetValue<RecurringClassFormData>;
  readonly control: Control<RecurringClassFormData>;
  readonly handleSubmit: UseFormHandleSubmit<RecurringClassFormData>;
  readonly isSubmitting: boolean;
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
  labels,
  onSubmit,
  meetingConfig,
  onMeetingConfigChangeAction,
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
          labels={labels}
          meetingConfig={meetingConfig}
          onMeetingConfigChangeAction={onMeetingConfigChangeAction}
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
          {labels.add}
        </StyledSubmitButton>

        {showSuccess && (
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

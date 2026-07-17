"use client";

import { AddOutlined } from "@mui/icons-material";
import { Alert, alpha, Box, Button } from "@mui/material";
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
import { RecurringClassFormFieldsMobile } from "@/frontend/mobile/views/dashboard/classes/recurring/components/recurringClassFormFields.mobile";
import type { CreateRecurringClassLabels } from "@/shared/locale";

interface RecurringClassFormMobileProps {
  readonly register: UseFormRegister<RecurringClassFormData>;
  readonly errors: FieldErrors<RecurringClassFormData>;
  readonly watch: UseFormWatch<RecurringClassFormData>;
  readonly setValue: UseFormSetValue<RecurringClassFormData>;
  readonly control: Control<RecurringClassFormData>;
  readonly handleSubmit: UseFormHandleSubmit<RecurringClassFormData>;
  readonly isSubmitting: boolean;
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
  p: 2,
  "&::-webkit-scrollbar": { width: 4 },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: theme.palette.divider,
    borderRadius: 2,
  },
}));

const StyledFormFooter = styled(Box)(({ theme }) => ({
  p: 2,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderTop: 1,
  borderColor: theme.palette.divider,
  backgroundColor: alpha(theme.palette.background.default, 0.5),
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: theme.zIndex.drawer + 2,
  pb: "calc(16px + env(safe-area-inset-bottom))",
}));

const StyledSubmitButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.sidebar,
  color: theme.palette.onSidebar,
  borderRadius: 10,
  px: 4,
  py: 1.75,
  typography: "labelUppercase",
  boxShadow: theme.palette.shadow.button,
  "&:hover": {
    backgroundColor: theme.palette.sidebar,
    filter: "brightness(1.1)",
  },
  maxWidth: 480,
}));

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
  labels,
  onSubmit,
  meetingConfig,
  onMeetingConfigChangeAction,
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
        <StyledSubmitButton
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          endIcon={<AddOutlined />}
          fullWidth
        >
          {labels.addClass}
        </StyledSubmitButton>
      </StyledFormFooter>
    </Box>
  );
}

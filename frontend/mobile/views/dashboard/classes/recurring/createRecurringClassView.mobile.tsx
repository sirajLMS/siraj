"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircleOutlined, CloseOutlined, ErrorOutlined } from "@mui/icons-material";
import { alpha, Box, IconButton, Snackbar, Typography, useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { PageContainer, PageHeader, SectionPanel } from "@/frontend/common/components/ui";
import { resolveBrowserIanaTimezoneId } from "@/frontend/common/lib/timezone";
import { RecurringClassForm } from "@/frontend/common/views/dashboard/classes/recurring/RecurringClassForm";
import type { RecurringClassFormData } from "@/frontend/common/views/dashboard/classes/recurring/recurringClassSchema";
import { createRecurringClassSchema } from "@/frontend/common/views/dashboard/classes/recurring/recurringClassSchema";
import { DEFAULT_DAY_SCHEDULE } from "@/frontend/common/views/dashboard/classes/recurring/types";
import {
  emptyRecurringMeetingConfigState,
  type RecurringMeetingConfigFormState,
} from "@/frontend/common/views/dashboard/classes/recurring/utils/postCreateRecurringMeetingConfig";
import type { CreateRecurringClassLabels } from "@/shared/locale";

interface CreateRecurringClassViewMobileProps {
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly errorMessage: string | null;
  readonly meetingConfigWarning?: boolean;
  readonly meetingConfigWarningMessage?: string;
  readonly goToClassLabel?: string;
  readonly onGoToCreatedClass?: () => void;
  readonly labels: CreateRecurringClassLabels;
  readonly onClose: () => void;
  readonly onSubmit: (data: RecurringClassFormData, meetingConfig: RecurringMeetingConfigFormState) => void;
  readonly onDismissSuccess: () => void;
  readonly onDismissError: () => void;
}

const StyledSuccessSnackbarContent = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  paddingInline: theme.spacing(3),
  paddingBlock: theme.spacing(1.5),
  borderRadius: 10,
  backgroundColor: theme.palette.sidebarContainer,
  color: theme.palette.onSidebarContainer,
  boxShadow: theme.palette.shadow.card,
}));

const StyledSuccessCheckIcon = styled(CheckCircleOutlined)(({ theme }) => ({
  backgroundColor: theme.palette.primaryContainer,
  color: theme.palette.onPrimaryContainer,
  borderRadius: "50%",
  padding: theme.spacing(0.5),
}));

const StyledHeaderCloseButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
}));

const StyledErrorSnackbarContent = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  paddingInline: theme.spacing(3),
  paddingBlock: theme.spacing(1.5),
  borderRadius: 10,
  backgroundColor: theme.palette.errorContainer,
  color: theme.palette.onErrorContainer,
  boxShadow: theme.palette.shadow.card,
}));

const StyledErrorIcon = styled(ErrorOutlined)(({ theme }) => ({
  backgroundColor: theme.palette.errorContainer,
  color: theme.palette.onErrorContainer,
  borderRadius: "50%",
  padding: theme.spacing(0.5),
}));

function buildFormLabels(labels: CreateRecurringClassLabels) {
  return {
    add: labels.add,
    addClass: labels.addClass,
    addedSuccessfully: labels.addedSuccessfully,
    students: labels.students,
    studentsPlaceholder: labels.studentsPlaceholder,
    teacher: labels.teacher,
    teacherPlaceholder: labels.teacherPlaceholder,
    defaultStartTime: labels.defaultStartTime,
    duration: labels.duration,
    durationHours: labels.durationHours,
    durationMinutes: labels.durationMinutes,
    hours: labels.hours,
    minutes: labels.minutes,
    daysSelection: labels.daysSelection,
    classSchedule: labels.classSchedule,
    timeOverride: labels.timeOverride,
    weekendOff: labels.weekendOff,
    timezone: labels.timezone,
    timezonePlaceholder: labels.timezonePlaceholder,
    classType: labels.classType,
    classTypePlaceholder: labels.classTypePlaceholder,
    days: labels.days,
  };
}

function SuccessSnackbar({
  open,
  onClose,
  labels,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly labels: string;
}) {
  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      sx={{ bottom: { xs: 96, sm: 96 } }}
      onClose={onClose}
    >
      <StyledSuccessSnackbarContent>
        <StyledSuccessCheckIcon />
        <Typography
          variant="labelUppercase"
          sx={{
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {labels}
        </Typography>
      </StyledSuccessSnackbarContent>
    </Snackbar>
  );
}

function ErrorSnackbar({
  open,
  onClose,
  message,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly message: string;
}) {
  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      sx={{ bottom: { xs: 96, sm: 96 } }}
      onClose={onClose}
    >
      <StyledErrorSnackbarContent>
        <StyledErrorIcon />
        <Typography
          variant="labelUppercase"
          sx={{
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {message}
        </Typography>
      </StyledErrorSnackbarContent>
    </Snackbar>
  );
}

export function CreateRecurringClassViewMobile({
  isSubmitting,
  showSuccess,
  errorMessage,
  meetingConfigWarning = false,
  meetingConfigWarningMessage,
  goToClassLabel,
  onGoToCreatedClass,
  labels,
  onClose,
  onSubmit,
  onDismissSuccess,
  onDismissError,
}: Readonly<CreateRecurringClassViewMobileProps>) {
  const theme = useTheme();
  const schema = useMemo(() => createRecurringClassSchema(labels.validation), [labels.validation]);
  const formLabels = useMemo(() => buildFormLabels(labels), [labels]);
  const [meetingConfig, setMeetingConfig] = useState<RecurringMeetingConfigFormState>(emptyRecurringMeetingConfigState);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<RecurringClassFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      studentId: "",
      teacherId: "",
      defaultStartTime: "09:00",
      durationHours: 0,
      durationMinutes: 45,
      timezone: resolveBrowserIanaTimezoneId(),
      classType: undefined,
      effectiveFrom: undefined,
      effectiveUntil: undefined,
      generateInstancesForWeeks: 4,
      days: DEFAULT_DAY_SCHEDULE.map(day => ({ ...day })),
    },
  });

  useEffect(() => {
    if (!showSuccess || meetingConfigWarning) return undefined;
    const timer = setTimeout(() => {
      onDismissSuccess();
    }, 3000);
    return () => {
      clearTimeout(timer);
    };
  }, [showSuccess, meetingConfigWarning, onDismissSuccess]);

  useEffect(() => {
    if (!errorMessage) return undefined;
    const timer = setTimeout(() => {
      onDismissError();
    }, 5000);
    return () => {
      clearTimeout(timer);
    };
  }, [errorMessage, onDismissError]);

  return (
    <PageContainer>
      <PageHeader
        title={labels.title}
        titleVariant="headlineMd"
        actions={
          <StyledHeaderCloseButton onClick={onClose} aria-label={labels.close}>
            <CloseOutlined />
          </StyledHeaderCloseButton>
        }
      />

      <Box sx={{ pb: 12 }}>
        <SectionPanel
          sx={{
            backgroundColor: alpha(theme.palette.surfaceContainer, 0.2),
          }}
        >
          <RecurringClassForm
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
            control={control}
            handleSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            isMobile
            showSuccess={showSuccess}
            meetingConfigWarning={meetingConfigWarning}
            meetingConfigWarningMessage={meetingConfigWarningMessage}
            goToClassLabel={goToClassLabel}
            onGoToCreatedClass={onGoToCreatedClass}
            labels={formLabels}
            meetingConfig={meetingConfig}
            onMeetingConfigChangeAction={setMeetingConfig}
            onSubmit={data => onSubmit(data, meetingConfig)}
          />
        </SectionPanel>
      </Box>

      <SuccessSnackbar open={showSuccess} onClose={onDismissSuccess} labels={labels.addedSuccessfully} />
      <ErrorSnackbar open={!!errorMessage} onClose={onDismissError} message={errorMessage ?? ""} />
    </PageContainer>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CloseOutlined } from "@mui/icons-material";
import { alpha, Box, IconButton, useTheme } from "@mui/material";
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

interface CreateRecurringClassViewDesktopProps {
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

const StyledHeaderCloseButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
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

export function CreateRecurringClassViewDesktop({
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
}: Readonly<CreateRecurringClassViewDesktopProps>) {
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

  const breadcrumbs = [
    { label: labels.breadcrumbs.dashboard, href: "/dashboard" },
    { label: labels.breadcrumbs.classes, href: "/dashboard" },
    { label: labels.title, current: true },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={labels.title}
        subtitle={labels.subtitle}
        titleVariant="headlineLg"
        breadcrumbs={breadcrumbs}
        actions={
          <StyledHeaderCloseButton onClick={onClose} aria-label={labels.close}>
            <CloseOutlined />
          </StyledHeaderCloseButton>
        }
      />

      <Box>
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
            isMobile={false}
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
    </PageContainer>
  );
}

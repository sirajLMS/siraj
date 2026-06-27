"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircleOutlined, CloseOutlined, ErrorOutlined } from "@mui/icons-material";
import { alpha, Box, IconButton, Snackbar, Typography, useMediaQuery, useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { PageContainer, PageHeader, SectionPanel } from "@/frontend/components/ui";
import type { CreateRecurringClassLabels } from "@/shared/messages/types/message";
import { RecurringClassForm } from "./RecurringClassForm";
import type { RecurringClassFormData } from "./recurringClassSchema";
import { createRecurringClassSchema } from "./recurringClassSchema";
import { DEFAULT_DAY_SCHEDULE } from "./types";

const USER_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

interface CreateRecurringClassViewProps {
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly errorMessage: string | null;
  readonly labels: CreateRecurringClassLabels;
  readonly onClose: () => void;
  readonly onSubmit: (data: RecurringClassFormData) => void;
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
            fontSize: "14px",
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
            fontSize: "14px",
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

export function CreateRecurringClassView({
  isSubmitting,
  showSuccess,
  errorMessage,
  labels,
  onClose,
  onSubmit,
  onDismissSuccess,
  onDismissError,
}: CreateRecurringClassViewProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const schema = useMemo(() => createRecurringClassSchema(labels.validation), [labels.validation]);
  const formLabels = useMemo(() => buildFormLabels(labels), [labels]);

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
      timezone: USER_TIMEZONE,
      classType: undefined,
      effectiveFrom: undefined,
      effectiveUntil: undefined,
      generateInstancesForWeeks: 4,
      days: DEFAULT_DAY_SCHEDULE.map(day => ({ ...day })),
    },
  });

  useEffect(() => {
    if (!showSuccess) return undefined;
    const timer = setTimeout(() => {
      onDismissSuccess();
    }, 3000);
    return () => {
      clearTimeout(timer);
    };
  }, [showSuccess, onDismissSuccess]);

  useEffect(() => {
    if (!errorMessage) return undefined;
    const timer = setTimeout(() => {
      onDismissError();
    }, 5000);
    return () => {
      clearTimeout(timer);
    };
  }, [errorMessage, onDismissError]);

  const breadcrumbs = isMobile
    ? undefined
    : [
        { label: labels.breadcrumbs.dashboard, href: "/dashboard" },
        { label: labels.breadcrumbs.classes, href: "/dashboard" },
        { label: labels.title, current: true },
      ];

  return (
    <PageContainer>
      <PageHeader
        title={labels.title}
        subtitle={isMobile ? undefined : labels.subtitle}
        titleVariant={isMobile ? "headlineMd" : "headlineLg"}
        breadcrumbs={breadcrumbs}
        actions={
          <StyledHeaderCloseButton onClick={onClose} aria-label={labels.close}>
            <CloseOutlined />
          </StyledHeaderCloseButton>
        }
      />

      <Box sx={{ pb: isMobile ? 12 : 0 }}>
        <SectionPanel
          sx={{
            backgroundColor: theme => alpha(theme.palette.surfaceContainer, 0.2),
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
            isMobile={isMobile}
            showSuccess={showSuccess}
            labels={formLabels}
            onSubmit={onSubmit}
          />
        </SectionPanel>
      </Box>

      {isMobile ? (
        <>
          <SuccessSnackbar open={showSuccess} onClose={onDismissSuccess} labels={labels.addedSuccessfully} />
          <ErrorSnackbar open={!!errorMessage} onClose={onDismissError} message={errorMessage ?? ""} />
        </>
      ) : null}
    </PageContainer>
  );
}

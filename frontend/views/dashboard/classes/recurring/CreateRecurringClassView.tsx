"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircleOutlined, CloseOutlined } from "@mui/icons-material";
import { alpha, Box, IconButton, Snackbar, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { PageContainer, PageHeader, SectionPanel } from "@/frontend/components/ui";
import type { StudentGroup } from "@/frontend/stores/mockCreateRecurringClassStore";
import { DEFAULT_DAY_SCHEDULE } from "@/frontend/stores/mockCreateRecurringClassStore";
import type { CreateRecurringClassLabels } from "@/shared/messages/types/message";
import { RecurringClassForm } from "./RecurringClassForm";
import type { RecurringClassFormData } from "./recurringClassSchema";
import { createRecurringClassSchema } from "./recurringClassSchema";

interface CreateRecurringClassViewProps {
  readonly studentGroups: readonly StudentGroup[];
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly labels: CreateRecurringClassLabels;
  readonly onClose: () => void;
  readonly onSubmit: (data: RecurringClassFormData) => void;
  readonly onDismissSuccess: () => void;
}

function buildFormLabels(labels: CreateRecurringClassLabels) {
  return {
    add: labels.add,
    addClass: labels.addClass,
    addedSuccessfully: labels.addedSuccessfully,
    students: labels.students,
    studentsPlaceholder: labels.studentsPlaceholder,
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
      <Box
        sx={theme => ({
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 3,
          py: 1.5,
          borderRadius: 10,
          bgcolor: theme.palette.sidebarContainer,
          color: theme.palette.onSidebarContainer,
          boxShadow: theme.palette.shadow.card,
        })}
      >
        <CheckCircleOutlined
          sx={theme => ({
            bgcolor: theme.palette.primaryContainer,
            color: theme.palette.onPrimaryContainer,
            borderRadius: "50%",
            p: 0.5,
          })}
        />
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
      </Box>
    </Snackbar>
  );
}

export function CreateRecurringClassView({
  studentGroups,
  isSubmitting,
  showSuccess,
  labels,
  onClose,
  onSubmit,
  onDismissSuccess,
}: CreateRecurringClassViewProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const schema = createRecurringClassSchema(labels.validation);
  const formLabels = buildFormLabels(labels);

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
      studentGroupId: "",
      defaultStartTime: "09:00",
      durationHours: 0,
      durationMinutes: 45,
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

  const breadcrumbs = isMobile
    ? undefined
    : [
        { label: labels.breadcrumbs.dashboard, href: "/dashboard" },
        { label: labels.breadcrumbs.classes, href: "/classes/new" },
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
          <IconButton
            onClick={onClose}
            aria-label={labels.close}
            sx={theme => ({ color: theme.palette.onSurfaceVariant })}
          >
            <CloseOutlined />
          </IconButton>
        }
      />

      <Box sx={{ pb: isMobile ? 12 : 0 }}>
        <SectionPanel
          sx={{
            bgcolor: theme => alpha(theme.palette.surfaceContainer, 0.2),
          }}
        >
          <RecurringClassForm
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
            control={control}
            handleSubmit={handleSubmit}
            studentGroups={studentGroups}
            isSubmitting={isSubmitting}
            isMobile={isMobile}
            showSuccess={showSuccess}
            labels={formLabels}
            onSubmit={onSubmit}
          />
        </SectionPanel>
      </Box>

      {isMobile ? (
        <SuccessSnackbar open={showSuccess} onClose={onDismissSuccess} labels={labels.addedSuccessfully} />
      ) : null}
    </PageContainer>
  );
}

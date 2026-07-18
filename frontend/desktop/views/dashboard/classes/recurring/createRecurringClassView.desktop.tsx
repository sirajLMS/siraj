"use client";

import { CloseOutlined } from "@mui/icons-material";
import { alpha, Box, IconButton, useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { CreateRecurringClassViewModel } from "@/frontend/common/views/dashboard/classes/recurring/useCreateRecurringClassViewModel";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { RecurringClassFormDesktop } from "@/frontend/desktop/views/dashboard/classes/recurring/components/recurringClassForm.desktop";

const StyledHeaderCloseButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
}));

export function CreateRecurringClassViewDesktop(viewModel: Readonly<CreateRecurringClassViewModel>) {
  const theme = useTheme();
  const {
    isSubmitting,
    showSuccess,
    meetingConfigWarning,
    meetingConfigWarningMessage,
    goToClassLabel,
    onGoToCreatedClass,
    labels,
    onClose,
    onSubmit,
    formLabels,
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    errors,
    meetingConfig,
    onMeetingConfigChange,
    students,
    teachers,
    studentsLoading,
    teachersLoading,
  } = viewModel;

  const breadcrumbs = [
    { label: labels.breadcrumbs.dashboard, href: "/dashboard" },
    { label: labels.breadcrumbs.classes, href: "/dashboard" },
    { label: labels.title, current: true },
  ];

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
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
        <DesktopSectionPanel
          sx={{
            backgroundColor: alpha(theme.palette.surfaceContainer, 0.2),
          }}
        >
          <RecurringClassFormDesktop
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
            control={control}
            handleSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            showSuccess={showSuccess}
            meetingConfigWarning={meetingConfigWarning}
            meetingConfigWarningMessage={meetingConfigWarningMessage}
            goToClassLabel={goToClassLabel}
            onGoToCreatedClass={onGoToCreatedClass}
            formLabels={formLabels}
            meetingConfig={meetingConfig}
            onMeetingConfigChangeAction={onMeetingConfigChange}
            students={students}
            teachers={teachers}
            studentsLoading={studentsLoading}
            teachersLoading={teachersLoading}
            onSubmit={data => onSubmit(data, meetingConfig)}
          />
        </DesktopSectionPanel>
      </Box>
    </DesktopPageContainer>
  );
}

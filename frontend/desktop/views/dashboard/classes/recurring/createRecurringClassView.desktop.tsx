"use client";

import { CloseOutlined } from "@mui/icons-material";
import { Box, IconButton } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import type { CreateRecurringClassViewModel } from "@/frontend/common/views/dashboard/classes/recurring/useCreateRecurringClassViewModel";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { RecurringClassFormDesktop } from "@/frontend/desktop/views/dashboard/classes/recurring/components/recurringClassForm.desktop";

const StyledHeaderCloseButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
}));

export function CreateRecurringClassViewDesktop(viewModel: Readonly<CreateRecurringClassViewModel>) {
  const {
    isSubmitting,
    showSuccess,
    meetingConfigWarning,
    labelsBySection,
    onGoToCreatedClass,
    onClose,
    onSubmit,
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    errors,
    meetingConfig,
    onMeetingConfigChange,
  } = viewModel;

  const { shell, form, notifications } = labelsBySection;

  const breadcrumbs = [
    { label: shell.breadcrumbs.dashboard, href: "/dashboard" },
    { label: shell.breadcrumbs.classes, href: "/dashboard" },
    { label: shell.title, current: true },
  ];

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={shell.title}
        subtitle={shell.subtitle}
        titleVariant="headlineLg"
        breadcrumbs={breadcrumbs}
        actions={
          <StyledHeaderCloseButton onClick={onClose} aria-label={shell.close}>
            <CloseOutlined />
          </StyledHeaderCloseButton>
        }
      />

      <Box>
        <DesktopSectionPanel
          sx={theme => ({
            backgroundColor: alpha(theme.palette.surfaceContainer, 0.2),
          })}
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
            meetingConfigWarningMessage={notifications.meetingConfigWarningMessage}
            goToClassLabel={notifications.goToClassLabel}
            onGoToCreatedClass={onGoToCreatedClass}
            formLabels={form}
            meetingConfig={meetingConfig}
            onMeetingConfigChangeAction={onMeetingConfigChange}
            onSubmit={data => onSubmit(data, meetingConfig)}
          />
        </DesktopSectionPanel>
      </Box>
    </DesktopPageContainer>
  );
}

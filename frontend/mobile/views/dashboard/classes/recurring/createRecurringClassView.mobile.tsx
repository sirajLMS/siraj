"use client";

import { CloseOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form";
import type { CreateRecurringClassViewModel } from "@/frontend/common/views/dashboard/classes/recurring/useCreateRecurringClassViewModel";
import { MobileFormErrorSnackbar, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { MobileSectionPanel } from "@/frontend/mobile/components/ui/container";
import { RecurringClassFormMobile } from "@/frontend/mobile/views/dashboard/classes/recurring/components/recurringClassForm.mobile";

const StyledHeaderCloseButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
}));

export function CreateRecurringClassViewMobile(viewModel: Readonly<CreateRecurringClassViewModel>) {
  const {
    isSubmitting,
    showSuccess,
    errorMessage,
    meetingConfigWarning,
    labelsBySection,
    onGoToCreatedClass,
    onClose,
    onSubmit,
    onDismissSuccess,
    onDismissError,
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    errors,
    subjects,
    subjectsLoading,
    meetingConfig,
    meetingConfigValidation,
    onMeetingConfigChange,
  } = viewModel;

  const { shell, form, notifications } = labelsBySection;

  return (
    <MobilePageContainer>
      <MobilePageHeader
        title={shell.title}
        titleVariant="headlineMd"
        actions={
          <StyledHeaderCloseButton onClick={onClose} aria-label={shell.close}>
            <CloseOutlined />
          </StyledHeaderCloseButton>
        }
      />

      <MobileSectionPanel
        sx={theme => ({
          backgroundColor: alpha(theme.palette.surfaceContainer, 0.2),
        })}
      >
        <RecurringClassFormMobile
          register={register}
          errors={errors}
          watch={watch}
          setValue={setValue}
          control={control}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          meetingConfigWarning={meetingConfigWarning}
          meetingConfigWarningMessage={notifications.meetingConfigWarningMessage}
          goToClassLabel={notifications.goToClassLabel}
          onGoToCreatedClass={onGoToCreatedClass}
          formLabels={form}
          subjects={subjects}
          subjectsLoading={subjectsLoading}
          meetingConfig={meetingConfig}
          meetingConfigValidation={meetingConfigValidation}
          onMeetingConfigChangeAction={onMeetingConfigChange}
          onSubmit={data => onSubmit(data, meetingConfig)}
        />
      </MobileSectionPanel>

      <FormSuccessSnackbar open={showSuccess} message={shell.addedSuccessfully} onClose={onDismissSuccess} />
      <MobileFormErrorSnackbar open={!!errorMessage} message={errorMessage ?? ""} onClose={onDismissError} />
    </MobilePageContainer>
  );
}

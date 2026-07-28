"use client";

import { CheckCircleOutlined, CloseOutlined, ErrorOutlined } from "@mui/icons-material";
import { Box, IconButton, Snackbar, Typography } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import type { CreateRecurringClassViewModel } from "@/frontend/common/views/dashboard/classes/recurring/useCreateRecurringClassViewModel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { MobileSectionPanel } from "@/frontend/mobile/components/ui/container";
import { RecurringClassFormMobile } from "@/frontend/mobile/views/dashboard/classes/recurring/components/recurringClassForm.mobile";

const StyledSuccessSnackbarContent = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  borderRadius: 10,
  backgroundColor: theme.palette.sidebarContainer,
  color: theme.palette.onSidebarContainer,
  boxShadow: theme.palette.shadow.card,
  paddingInline: theme.spacing(3),
  paddingBlock: theme.spacing(1.5),
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
  borderRadius: 10,
  backgroundColor: theme.palette.errorContainer,
  color: theme.palette.onErrorContainer,
  boxShadow: theme.palette.shadow.card,
  paddingInline: theme.spacing(3),
  paddingBlock: theme.spacing(1.5),
}));

const StyledErrorIcon = styled(ErrorOutlined)(({ theme }) => ({
  backgroundColor: theme.palette.errorContainer,
  color: theme.palette.onErrorContainer,
  borderRadius: "50%",
  padding: theme.spacing(0.5),
}));

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
        <Typography variant="labelUppercase" sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
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
        <Typography variant="labelUppercase" sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
          {message}
        </Typography>
      </StyledErrorSnackbarContent>
    </Snackbar>
  );
}

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
    meetingConfig,
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
          meetingConfig={meetingConfig}
          onMeetingConfigChangeAction={onMeetingConfigChange}
          onSubmit={data => onSubmit(data, meetingConfig)}
        />
      </MobileSectionPanel>

      <SuccessSnackbar open={showSuccess} onClose={onDismissSuccess} labels={shell.addedSuccessfully} />
      <ErrorSnackbar open={!!errorMessage} onClose={onDismissError} message={errorMessage ?? ""} />
    </MobilePageContainer>
  );
}

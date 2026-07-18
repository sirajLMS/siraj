"use client";

import { CheckCircleOutlined, CloseOutlined, ErrorOutlined } from "@mui/icons-material";
import { alpha, Box, IconButton, Snackbar, Typography, useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";
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
  const theme = useTheme();
  const {
    isSubmitting,
    showSuccess,
    errorMessage,
    meetingConfigWarning,
    meetingConfigWarningMessage,
    goToClassLabel,
    onGoToCreatedClass,
    labels,
    onClose,
    onSubmit,
    onDismissSuccess,
    onDismissError,
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

  return (
    <MobilePageContainer>
      <MobilePageHeader
        title={labels.title}
        titleVariant="headlineMd"
        actions={
          <StyledHeaderCloseButton onClick={onClose} aria-label={labels.close}>
            <CloseOutlined />
          </StyledHeaderCloseButton>
        }
      />

      <Box sx={{ pb: 12 }}>
        <MobileSectionPanel
          sx={{
            backgroundColor: alpha(theme.palette.surfaceContainer, 0.2),
          }}
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
        </MobileSectionPanel>
      </Box>

      <SuccessSnackbar open={showSuccess} onClose={onDismissSuccess} labels={labels.addedSuccessfully} />
      <ErrorSnackbar open={!!errorMessage} onClose={onDismissError} message={errorMessage ?? ""} />
    </MobilePageContainer>
  );
}

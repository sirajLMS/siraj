"use client";

import { Box, type BoxProps, Button, type ButtonProps, Divider, styled, useMediaQuery, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import type { Control, FieldErrors, UseFormGetValues, UseFormHandleSubmit, UseFormSetValue } from "react-hook-form";
import { FormSuccessSnackbar, PageContainer, PageHeader, SectionPanel } from "@/frontend/components/ui";
import type { RescheduleSession } from "@/frontend/stores/mockRescheduleStore";
import { ClassParticipantsSection } from "./ClassParticipantsSection";
import { NotificationPolicyCard } from "./NotificationPolicyCard";
import { QuickAdjustSection } from "./QuickAdjustSection";
import { RescheduleDateTimeSection } from "./RescheduleDateTimeSection";
import type { RescheduleFormData } from "./schemas/rescheduleSchema";
import { TimezoneWarningBanner } from "./TimezoneWarningBanner";

interface Props {
  readonly session: RescheduleSession;
  readonly control: Control<RescheduleFormData>;
  readonly errors: FieldErrors<RescheduleFormData>;
  readonly setValue: UseFormSetValue<RescheduleFormData>;
  readonly getValues: UseFormGetValues<RescheduleFormData>;
  readonly handleSubmit: UseFormHandleSubmit<RescheduleFormData>;
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly onSubmit: (data: RescheduleFormData) => void | Promise<void>;
  readonly onCancel: () => void;
  readonly onDismissSuccess: () => void;
}

const CancelButton = styled(Button)<ButtonProps>(({ theme }) => ({
  // Keep the responsive maxWidth using standard CSS/MUI MQ syntax
  width: "100%", // handles the 'fullWidth' behavior natively if preferred
  [theme.breakpoints.up("sm")]: {
    maxWidth: 200,
  },
  paddingTop: theme.spacing(1.5),
  paddingBottom: theme.spacing(1.5),
  borderRadius: 99,
  fontWeight: 700,
  letterSpacing: "0.1em",
  backgroundColor: theme.palette.errorContainer,
  color: theme.palette.error.main,
  boxShadow: "none",
  "&:hover": {
    backgroundColor: theme.palette.errorContainer,
    filter: "brightness(0.95)",
    boxShadow: "none", // ensures shadow doesn't reappear on hover
  },
}));

const SubmitButton = styled(Button)<ButtonProps>(({ theme }) => ({
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    maxWidth: 200,
  },
  paddingTop: theme.spacing(1.5),
  paddingBottom: theme.spacing(1.5),
  borderRadius: 99,
  fontWeight: 700,
  letterSpacing: "0.1em",
  backgroundColor: theme.palette.primary.main,
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
  },
}));

const ActionContainer = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  // theme.spacing(2) ensures it uses your theme's spacing baseline (usually 16px)
  gap: theme.spacing(2),

  // Responsive switch to row layout on small screens and up
  [theme.breakpoints.up("sm")]: {
    flexDirection: "row",
  },
}));

export function RescheduleView({
  session,
  control,
  errors,
  setValue,
  getValues,
  handleSubmit,
  isSubmitting,
  showSuccess,
  onSubmit,
  onCancel,
  onDismissSuccess,
}: Readonly<Props>) {
  const t = useTranslations("dashboard.rescheduleForm");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const submitLabel = isMobile ? t("actions.submitMobile") : t("actions.submit");

  return (
    <PageContainer sx={{ maxWidth: 900, mx: "auto" }}>
      <PageHeader title={t("pageTitle")} subtitle={t("pageSubtitle")} />

      <TimezoneWarningBanner timezone={session.teacherTimezone} />

      <SectionPanel title={t("sections.classDetails")}>
        <Box
          component="form"
          onSubmit={e => {
            handleSubmit(onSubmit)(e);
          }}
          sx={theme => ({ p: theme.layout.cardPadding, display: "flex", flexDirection: "column", gap: 4 })}
        >
          <ClassParticipantsSection session={session} />

          <Divider />

          <RescheduleDateTimeSection control={control} errors={errors} />

          <QuickAdjustSection setValue={setValue} getValues={getValues} />

          <ActionContainer>
            {/* submit */}
            <SubmitButton type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? t("actions.processing") : submitLabel}
            </SubmitButton>
            {/* cancel */}
            <CancelButton type="button" variant="contained" onClick={onCancel}>
              {t("actions.cancel")}
            </CancelButton>
          </ActionContainer>
        </Box>
      </SectionPanel>

      {isMobile && <NotificationPolicyCard />}

      <FormSuccessSnackbar open={showSuccess} message={t("actions.successMessage")} onClose={onDismissSuccess} />
    </PageContainer>
  );
}

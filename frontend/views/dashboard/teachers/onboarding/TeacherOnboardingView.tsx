"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircleOutlined } from "@mui/icons-material";
import { Box, Button, Snackbar, Typography } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { PageContainer, PageHeader, SectionPanel } from "@/frontend/components/ui";
import type { MessageSchema } from "@/shared/messages/types/message";
import { BankingLedgerSection } from "./components/BankingLedgerSection";
import { OfficialDetailsSection } from "./components/OfficialDetailsSection";
import { SalaryDetailsSection } from "./components/SalaryDetailsSection";
import { TeacherInfoSection } from "./components/TeacherInfoSection";
import type { TeacherOnboardingFormData } from "./schemas/teacherOnboardingSchema";
import { teacherOnboardingSchema } from "./schemas/teacherOnboardingSchema";

interface TeacherOnboardingViewProps {
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly labels: MessageSchema["dashboard"]["teacherOnboarding"];
  readonly onSubmit: (data: TeacherOnboardingFormData) => void | Promise<void>;
  readonly onDismissSuccess: () => void;
}

function OnboardingBanner() {
  return (
    <Box
      sx={{
        width: "100%",
        height: 128,
        borderRadius: 3,
        overflow: "hidden",
        position: "relative",
        mb: 2,
      }}
    >
      <Box component="img" src="/demo/avatars/03.png" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <Box
        sx={theme => ({
          position: "absolute",
          inset: 0,
          background: `linear-gradient(to top, ${theme.palette.scrim} 0%, transparent 100%)`,
        })}
      />
      <Box sx={theme => ({ position: "absolute", bottom: 16, left: 16, color: theme.palette.common.white })}>
        <Typography variant="labelUppercase" sx={{ opacity: 0.9 }}>
          Join our faculty
        </Typography>
        <Typography variant="headlineMd">Registration Form</Typography>
      </Box>
    </Box>
  );
}

function FormActions({
  isSubmitting,
  labels,
}: {
  readonly isSubmitting: boolean;
  readonly labels: MessageSchema["dashboard"]["teacherOnboarding"];
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <Button
        type="submit"
        variant="contained"
        disabled={isSubmitting}
        sx={theme => ({
          bgcolor: theme.palette.status.active,
          color: theme.palette.status.onActive,
          "&:hover": { bgcolor: theme.palette.status.active },
          px: 5,
          py: 1.5,
          borderRadius: 2,
          fontWeight: 700,
          letterSpacing: "0.1em",
        })}
      >
        {isSubmitting ? labels.actions.proceeding : labels.actions.signup}
      </Button>
      <Button
        type="reset"
        variant="text"
        sx={theme => ({ color: theme.palette.text.secondary, fontWeight: 700, letterSpacing: "0.1em" })}
      >
        {labels.actions.cancel}
      </Button>
    </Box>
  );
}

export function TeacherOnboardingView({
  isSubmitting,
  showSuccess,
  labels,
  onSubmit,
  onDismissSuccess,
}: Readonly<TeacherOnboardingViewProps>) {
  const schema = teacherOnboardingSchema(labels.validation);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TeacherOnboardingFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      gender: "",
      country: "Egypt",
      timezone: "(GMT+02:00) Cairo",
      currency: "USD",
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

  return (
    <PageContainer>
      <PageHeader
        title={labels.pageTitle}
        subtitle={labels.pageSubtitle}
        actions={
          <Typography
            variant="labelUppercase"
            sx={theme => ({ color: theme.palette.error.main, display: { xs: "none", md: "block" } })}
          >
            {labels.mandatoryFields}
          </Typography>
        }
      />
      <Box
        component="form"
        onSubmit={e => {
          handleSubmit(onSubmit)(e);
        }}
        sx={{ display: "flex", flexDirection: "column", gap: 4, pb: 12 }}
      >
        <OnboardingBanner />
        <SectionPanel title={labels.sections.teacherInfo}>
          <TeacherInfoSection register={register} errors={errors} labels={labels} />
        </SectionPanel>
        <SectionPanel title={labels.sections.officialDetails}>
          <OfficialDetailsSection register={register} errors={errors} labels={labels} />
        </SectionPanel>
        <SectionPanel title={labels.sections.salaryDetails}>
          <SalaryDetailsSection register={register} errors={errors} labels={labels} />
        </SectionPanel>
        <SectionPanel title={labels.sections.bankingLedger}>
          <BankingLedgerSection register={register} errors={errors} labels={labels} />
        </SectionPanel>
        <FormActions isSubmitting={isSubmitting} labels={labels} />
      </Box>
      <Snackbar
        open={showSuccess}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        onClose={onDismissSuccess}
      >
        <Box
          sx={theme => ({
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 3,
            py: 1.5,
            borderRadius: 10,
            bgcolor: theme.palette.primary.main,
            color: theme.palette.onPrimary,
            boxShadow: theme.palette.shadow.card,
          })}
        >
          <CheckCircleOutlined />
          <Typography sx={{ fontWeight: 700 }}>{labels.actions.successMessage}</Typography>
        </Box>
      </Snackbar>
    </PageContainer>
  );
}

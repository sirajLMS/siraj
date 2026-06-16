"use client";

import { Box, Button } from "@mui/material";
import { useTranslations } from "next-intl";
import type { Control, FieldErrors, UseFormHandleSubmit, UseFormRegister } from "react-hook-form";
import { FormSuccessSnackbar, PageContainer, PageHeader } from "@/frontend/components/ui";
import { OnboardingMetricsOverview } from "./OnboardingMetricsOverview";
import { StaffInfoSection } from "./StaffInfoSection";
import { SystemAccessSection } from "./SystemAccessSection";
import type { ManagerOnboardingFormData } from "./schemas/managerOnboardingSchema";

interface Props {
  readonly register: UseFormRegister<ManagerOnboardingFormData>;
  readonly control: Control<ManagerOnboardingFormData>;
  readonly errors: FieldErrors<ManagerOnboardingFormData>;
  readonly handleSubmit: UseFormHandleSubmit<ManagerOnboardingFormData>;
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly onSubmit: (data: ManagerOnboardingFormData) => void | Promise<void>;
  readonly onCancel: () => void;
  readonly onDismissSuccess: () => void;
}

export function ManagerOnboardingView({
  register,
  control,
  errors,
  handleSubmit,
  isSubmitting,
  showSuccess,
  onSubmit,
  onCancel,
  onDismissSuccess,
}: Readonly<Props>) {
  const t = useTranslations("dashboard.managerOnboarding");

  return (
    <PageContainer>
      <PageHeader title={t("pageTitle")} subtitle={t("pageSubtitle")} />

      <Box
        component="form"
        onSubmit={e => {
          handleSubmit(onSubmit)(e);
        }}
        sx={{ display: "flex", flexDirection: "column", gap: 3 }}
      >
        <StaffInfoSection register={register} errors={errors} />
        <SystemAccessSection control={control} errors={errors} />

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexDirection: { xs: "column-reverse", sm: "row" },
            gap: 2,
            pt: 2,
            borderTop: theme => `1px solid ${theme.palette.outlineVariant}`,
          }}
        >
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            fullWidth
            sx={theme => ({
              maxWidth: { sm: 280 },
              px: 6,
              py: 2,
              borderRadius: 2,
              fontWeight: 700,
              letterSpacing: "0.1em",
              bgcolor: theme.palette.primary.main,
              "&:hover": { bgcolor: theme.palette.primary.dark },
            })}
          >
            {isSubmitting ? t("actions.processing") : t("actions.signup")}
          </Button>
          <Button
            type="button"
            variant="text"
            onClick={onCancel}
            fullWidth
            sx={theme => ({
              maxWidth: { sm: 200 },
              color: theme.palette.text.secondary,
              fontWeight: 700,
              letterSpacing: "0.1em",
            })}
          >
            {t("actions.cancel")}
          </Button>
        </Box>
      </Box>

      <OnboardingMetricsOverview />

      <FormSuccessSnackbar open={showSuccess} message={t("actions.successMessage")} onClose={onDismissSuccess} />
    </PageContainer>
  );
}

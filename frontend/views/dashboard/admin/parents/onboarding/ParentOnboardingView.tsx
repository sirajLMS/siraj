"use client";

import { InfoOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { FieldErrors, UseFormHandleSubmit, UseFormRegister } from "react-hook-form";
import { PageContainer, PageHeader, PrimaryPageAction } from "@/frontend/components/ui";
import { FeesContractSection } from "./FeesContractSection";
import { ParentInfoSection } from "./ParentInfoSection";
import { SocialCommsSection } from "./SocialCommsSection";
import type { ParentOnboardingFormData } from "./schemas/parentOnboardingSchema";

interface Props {
  readonly register: UseFormRegister<ParentOnboardingFormData>;
  readonly errors: FieldErrors<ParentOnboardingFormData>;
  readonly handleSubmit: UseFormHandleSubmit<ParentOnboardingFormData>;
  readonly isSubmitting: boolean;
  readonly onSubmit: (data: ParentOnboardingFormData) => void | Promise<void>;
}

export function ParentOnboardingView({ register, errors, handleSubmit, isSubmitting, onSubmit }: Props) {
  const t = useTranslations("dashboard.parentOnboarding");

  return (
    <PageContainer>
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        actions={
          <Stack
            direction="row"
            spacing={2}
            sx={theme => ({
              display: { xs: "none", sm: "flex" },
              alignItems: "center",
              backgroundColor: theme.palette.primaryContainer,
              color: theme.palette.onPrimaryContainer,
              px: 2,
              py: 1,
              borderRadius: 2,
            })}
          >
            <InfoOutlined />
            <Typography variant="labelMd">{t("statusBanner")}</Typography>
          </Stack>
        }
      />

      <Box
        component="form"
        onSubmit={e => {
          handleSubmit(onSubmit)(e);
        }}
        sx={{ display: "flex", flexDirection: "column", gap: 3 }}
      >
        <ParentInfoSection register={register} errors={errors} />
        <SocialCommsSection register={register} />
        <FeesContractSection register={register} errors={errors} />

        <Box
          sx={theme => ({
            p: 3,
            backgroundColor: theme.palette.surfaceContainerLow,
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
          })}
        >
          <PrimaryPageAction
            type="submit"
            disabled={isSubmitting}
            sx={{
              px: 6,
              py: 2,
              fontWeight: "bold",
              letterSpacing: "0.1em",
              minWidth: 200,
            }}
          >
            {isSubmitting ? t("actions.processing") : t("actions.signup")}
          </PrimaryPageAction>
          <Typography variant="labelMd" sx={theme => ({ fontStyle: "italic", color: theme.palette.text.secondary })}>
            {t("privacyNote")}
          </Typography>
        </Box>
      </Box>
    </PageContainer>
  );
}

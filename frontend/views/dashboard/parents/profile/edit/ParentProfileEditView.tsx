"use client";

import { InfoOutlined } from "@mui/icons-material";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { FieldErrors, UseFormHandleSubmit, UseFormRegister } from "react-hook-form";
import { PageContainer, PageHeader } from "@/frontend/components/ui";
import { FeesContractSection } from "../../onboarding/FeesContractSection";
import { ParentInfoSection } from "../../onboarding/ParentInfoSection";
import { SocialCommsSection } from "../../onboarding/SocialCommsSection";
import type { ParentOnboardingFormData } from "../../onboarding/schemas/parentOnboardingSchema";
import type { ParentProfileEditFormData } from "./parentProfileEditSchema";

interface Props {
  readonly register: UseFormRegister<ParentProfileEditFormData>;
  readonly errors: FieldErrors<ParentProfileEditFormData>;
  readonly handleSubmit: UseFormHandleSubmit<ParentProfileEditFormData>;
  readonly onSubmit: (data: ParentProfileEditFormData) => void | Promise<void>;
}

export default function ParentProfileEditView({ register, errors, handleSubmit, onSubmit }: Props) {
  const t = useTranslations("dashboard.parentProfile");
  const tOnboarding = useTranslations("dashboard.parentOnboarding");

  const onboardingRegister = register as unknown as UseFormRegister<ParentOnboardingFormData>;
  const onboardingErrors = errors as unknown as FieldErrors<ParentOnboardingFormData>;

  return (
    <PageContainer>
      <PageHeader
        title={t("actions.editProfile")}
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
            <Typography variant="labelMd">{t("sections.parentInfo")}</Typography>
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
        <ParentInfoSection register={onboardingRegister} errors={onboardingErrors} />
        <SocialCommsSection register={onboardingRegister} />
        <FeesContractSection register={onboardingRegister} errors={onboardingErrors} />

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
          <Button
            type="submit"
            variant="contained"
            sx={{
              px: 6,
              py: 2,
              borderRadius: 2,
              fontWeight: "bold",
              letterSpacing: "0.1em",
              minWidth: 200,
            }}
          >
            {tOnboarding("actions.signup")}
          </Button>
          <Typography variant="labelMd" sx={theme => ({ fontStyle: "italic", color: theme.palette.text.secondary })}>
            {tOnboarding("privacyNote")}
          </Typography>
        </Box>
      </Box>
    </PageContainer>
  );
}

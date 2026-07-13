"use client";

import { Box, Button, Grid, Input, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslations } from "next-intl";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller, useWatch } from "react-hook-form";
import { SectionPanel } from "@/frontend/common/components/ui/container/SectionPanel";
import { FieldWrapper, standardInputSx } from "@/frontend/common/components/ui/form";
import type { ManagerOnboardingFormData } from "@/frontend/views/dashboard/managers/onboarding/schemas/managerOnboardingSchema";
import { ManagerAccountType } from "@/frontend/views/dashboard/managers/onboarding/types";

const ACCOUNT_TYPES: readonly ManagerAccountType[] = [ManagerAccountType.Manager, ManagerAccountType.Admin];

const StyledAccountTypeContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  padding: theme.spacing(0.5),
  borderRadius: Number(theme.shape.borderRadius) * 2,
  backgroundColor: theme.palette.surfaceContainer,
  width: "100%",
}));

const StyledAccountTypeButton = styled(Button, {
  shouldForwardProp: prop => prop !== "isSelected",
})<{ isSelected: boolean }>(({ theme, isSelected }) => ({
  flex: 1,
  padding: `${theme.spacing(1.5)}`,
  borderRadius: Number(theme.shape.borderRadius) * 1.5,
  fontWeight: 700,
  letterSpacing: "0.1em",
  backgroundColor: isSelected ? theme.palette.primary.main : "transparent",
  color: isSelected ? theme.palette.onPrimary : theme.palette.onSurfaceVariant,
  "&:hover": {
    backgroundColor: isSelected ? theme.palette.primary.main : theme.palette.action.hover,
  },
}));

function AccountTypeToggle({ control }: { readonly control: Control<ManagerOnboardingFormData> }) {
  const t = useTranslations("dashboard.managerOnboarding");

  return (
    <Controller
      name="accountType"
      control={control}
      render={({ field }) => (
        <StyledAccountTypeContainer>
          {ACCOUNT_TYPES.map(type => {
            const isSelected = field.value === type;
            return (
              <StyledAccountTypeButton
                key={type}
                type="button"
                variant="text"
                isSelected={isSelected}
                onClick={() => {
                  field.onChange(type);
                }}
              >
                {t(`options.accountType.${type.toLowerCase()}`)}
              </StyledAccountTypeButton>
            );
          })}
        </StyledAccountTypeContainer>
      )}
    />
  );
}

interface Props {
  readonly register: UseFormRegister<ManagerOnboardingFormData>;
  readonly control: Control<ManagerOnboardingFormData>;
  readonly errors: FieldErrors<ManagerOnboardingFormData>;
}

export function SystemAccessSection({ register, control, errors }: Props) {
  const t = useTranslations("dashboard.managerOnboarding");
  const accountType = useWatch({ control, name: "accountType" });
  const descriptionKey =
    accountType === ManagerAccountType.Admin
      ? "options.accountTypeDescriptions.admin"
      : "options.accountTypeDescriptions.manager";

  return (
    <SectionPanel title={t("sections.systemAccess")}>
      <Grid container spacing={3} sx={theme => ({ p: theme.layout.cardPadding })}>
        <Grid size={{ xs: 12, md: 6 }}>
          <FieldWrapper label={t("fields.accountType")}>
            <AccountTypeToggle control={control} />
            <Typography variant="bodyMd" sx={theme => ({ mt: 1.5, color: theme.palette.text.secondary })}>
              {t(descriptionKey)}
            </Typography>
          </FieldWrapper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FieldWrapper
            label={t("fields.password")}
            required
            error={errors.password ? t(`validation.${errors.password.message}`) : undefined}
          >
            <Input
              {...register("password")}
              type="password"
              placeholder={t("placeholders.password")}
              error={!!errors.password}
              fullWidth
              sx={standardInputSx}
            />
          </FieldWrapper>
        </Grid>
      </Grid>
    </SectionPanel>
  );
}

"use client";

import { Box, Button, Grid, MenuItem, Select, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller, useWatch } from "react-hook-form";
import { FieldWrapper, standardInputSx } from "@/frontend/components/ui/form";
import { SectionPanel } from "@/frontend/components/ui/SectionPanel";
import type { ManagerAccountType, ManagerOnboardingFormData } from "./schemas/managerOnboardingSchema";

interface Props {
  readonly control: Control<ManagerOnboardingFormData>;
  readonly errors: FieldErrors<ManagerOnboardingFormData>;
}

const ACCOUNT_TYPES: readonly ManagerAccountType[] = ["manager", "admin"];

const DEPARTMENTS = [
  { value: "academic", labelKey: "academic" },
  { value: "operations", labelKey: "operations" },
  { value: "human_resources", labelKey: "humanResources" },
  { value: "it_support", labelKey: "itSupport" },
] as const;

function AccountTypeToggle({ control }: { readonly control: Control<ManagerOnboardingFormData> }) {
  const t = useTranslations("dashboard.managerOnboarding");

  return (
    <Controller
      name="accountType"
      control={control}
      render={({ field }) => (
        <Box
          sx={theme => ({
            display: "flex",
            p: 0.5,
            borderRadius: 2,
            bgcolor: theme.palette.surfaceContainer,
            width: "100%",
          })}
        >
          {ACCOUNT_TYPES.map(type => {
            const isSelected = field.value === type;
            return (
              <Button
                key={type}
                type="button"
                onClick={() => {
                  field.onChange(type);
                }}
                sx={theme => ({
                  flex: 1,
                  py: 1.5,
                  borderRadius: 1.5,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  bgcolor: isSelected ? theme.palette.primary.main : "transparent",
                  color: isSelected ? theme.palette.onPrimary : theme.palette.onSurfaceVariant,
                  "&:hover": {
                    bgcolor: isSelected ? theme.palette.primary.main : theme.palette.action.hover,
                  },
                })}
              >
                {t(`options.accountType.${type}`)}
              </Button>
            );
          })}
        </Box>
      )}
    />
  );
}

function DepartmentSelect({
  control,
  errors,
}: {
  readonly control: Control<ManagerOnboardingFormData>;
  readonly errors: FieldErrors<ManagerOnboardingFormData>;
}) {
  const t = useTranslations("dashboard.managerOnboarding");

  return (
    <Controller
      name="department"
      control={control}
      render={({ field }) => (
        <FieldWrapper
          label={t("fields.department")}
          required
          error={errors.department ? t(`validation.${errors.department.message}`) : undefined}
        >
          <Select {...field} error={!!errors.department} fullWidth variant="standard" displayEmpty sx={standardInputSx}>
            <MenuItem value="" disabled>
              {t("placeholders.department")}
            </MenuItem>
            {DEPARTMENTS.map(dept => (
              <MenuItem key={dept.value} value={dept.value}>
                {t(`options.department.${dept.labelKey}`)}
              </MenuItem>
            ))}
          </Select>
        </FieldWrapper>
      )}
    />
  );
}

export function SystemAccessSection({ control, errors }: Props) {
  const t = useTranslations("dashboard.managerOnboarding");
  const accountType = useWatch({ control, name: "accountType" });
  const descriptionKey =
    accountType === "admin" ? "options.accountTypeDescriptions.admin" : "options.accountTypeDescriptions.manager";

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
          <DepartmentSelect control={control} errors={errors} />
        </Grid>
      </Grid>
    </SectionPanel>
  );
}

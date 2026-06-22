"use client";

import { Box, Button, Grid, MenuItem, Select, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslations } from "next-intl";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller, useWatch } from "react-hook-form";
import { FieldWrapper, standardInputSx } from "@/frontend/components/ui/form";
import { SectionPanel } from "@/frontend/components/ui/SectionPanel";
import type { ManagerAccountType, ManagerOnboardingFormData } from "./schemas/managerOnboardingSchema";

const ACCOUNT_TYPES: readonly ManagerAccountType[] = ["manager", "admin"];

const DEPARTMENTS = [
  { value: "academic", labelKey: "academic" },
  { value: "operations", labelKey: "operations" },
  { value: "human_resources", labelKey: "humanResources" },
  { value: "it_support", labelKey: "itSupport" },
] as const;

/* ────────────────────────────────────────────────────────────────────────────
 * Styled Components — Extracted inline sx styles for reusability & consistency
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Container for account type toggle buttons.
 * Provides rounded background matching surface container.
 */
const StyledAccountTypeContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  padding: theme.spacing(0.5),
  borderRadius: Number(theme.shape.borderRadius) * 2,
  backgroundColor: theme.palette.surfaceContainer,
  width: "100%",
}));

/**
 * Individual toggle button within the account type selector.
 * Changes appearance based on selected state.
 */
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

/* ────────────────────────────────────────────────────────────────────────────
 * Account Type Toggle Sub-component
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Toggle control for selecting manager or admin account type.
 * Renders two styled buttons within a container.
 */
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
                {t(`options.accountType.${type}`)}
              </StyledAccountTypeButton>
            );
          })}
        </StyledAccountTypeContainer>
      )}
    />
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Department Select Sub-component
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Department selection dropdown with error handling.
 */
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

/* ────────────────────────────────────────────────────────────────────────────
 * Component Interface
 * ──────────────────────────────────────────────────────────────────────────── */

interface Props {
  readonly control: Control<ManagerOnboardingFormData>;
  readonly errors: FieldErrors<ManagerOnboardingFormData>;
}

/* ────────────────────────────────────────────────────────────────────────────
 * SystemAccessSection Component
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * System access configuration section for manager onboarding.
 *
 * Contains:
 * - Account Type Toggle: Choose between "manager" or "admin"
 * - Department Select: Assign department to the new staff member
 *
 * Displays a dynamic description based on the selected account type.
 */
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

"use client";

import { Box, Button, FormControl, FormLabel, Grid, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { Control } from "react-hook-form";
import { Controller, useWatch } from "react-hook-form";
import { SectionPanel } from "@/frontend/common/components/ui/container/SectionPanel";
import { ManagerAccountType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { ManagerOnboardingFormData } from "@/frontend/common/types/shared.types";
import { useAppTranslation } from "@/shared/locale";

const ACCOUNT_TYPES: readonly ManagerAccountType[] = [
  ManagerAccountType.Manager,
  ManagerAccountType.Admin,
  ManagerAccountType.Supervisor,
];

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
  const t = useAppTranslation().dashboardTranslations.staffOnboarding;

  return (
    <Controller
      name="accountType"
      control={control}
      render={({ field }) => (
        <StyledAccountTypeContainer>
          {ACCOUNT_TYPES.map(type => {
            const isSelected = field.value === type;
            const labelKey = type.toLowerCase() as "manager" | "admin" | "supervisor";
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
                {t.options.accountType[labelKey]}
              </StyledAccountTypeButton>
            );
          })}
        </StyledAccountTypeContainer>
      )}
    />
  );
}

interface Props {
  readonly control: Control<ManagerOnboardingFormData>;
}

export function SystemAccessSection({ control }: Props) {
  const t = useAppTranslation().dashboardTranslations.staffOnboarding;
  const accountType = useWatch({ control, name: "accountType" });

  const getDescription = (): string => {
    if (accountType === ManagerAccountType.Admin) {
      return t.options.accountTypeDescriptions.admin;
    }
    if (accountType === ManagerAccountType.Supervisor) {
      return t.options.accountTypeDescriptions.supervisor;
    }
    return t.options.accountTypeDescriptions.manager;
  };

  return (
    <SectionPanel title={t.sections.systemAccess}>
      <Grid container spacing={3} sx={theme => ({ p: theme.layout.cardPadding })}>
        <Grid size={{ xs: 12 }}>
          <FormControl fullWidth>
            <FormLabel sx={theme => ({ mb: 1, color: theme.palette.onSurfaceVariant })}>
              {t.fields.accountType}
            </FormLabel>
            <AccountTypeToggle control={control} />
            <Typography variant="bodyMd" sx={theme => ({ mt: 1.5, color: theme.palette.text.secondary })}>
              {getDescription()}
            </Typography>
          </FormControl>
        </Grid>
      </Grid>
    </SectionPanel>
  );
}

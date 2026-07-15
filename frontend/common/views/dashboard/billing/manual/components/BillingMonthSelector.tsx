"use client";

import { Box, Checkbox, FormControlLabel, FormHelperText, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import { BILLING_MONTH_IDS } from "@/frontend/common/views/dashboard/billing/manual/constants/billingMonths";
import type { ManualInvoiceFormData } from "@/frontend/common/views/dashboard/billing/manual/schemas/manualInvoiceSchema";
import type { BillingManualLabels } from "@/shared/locale/types/dashboard/billing/manual";

interface BillingMonthSelectorProps {
  readonly control: Control<ManualInvoiceFormData>;
  readonly errors: FieldErrors<ManualInvoiceFormData>;
  readonly labels: BillingManualLabels;
  readonly variant: "desktop" | "mobile";
}

// Section label with uppercase transformation and surface variant color
const StyledSectionLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
  textTransform: "uppercase",
}));

function getMonthChipLabel(monthId: string, labels: BillingManualLabels, variant: "desktop" | "mobile"): string {
  if (variant === "mobile") {
    return monthId.toUpperCase();
  }

  return labels.months[monthId as keyof BillingManualLabels["months"]];
}

export function BillingMonthSelector({ control, errors, labels, variant }: Readonly<BillingMonthSelectorProps>) {
  const isMobile = variant === "mobile";
  const sectionLabel = isMobile ? labels.billingMonthsMobile : labels.billingMonths;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <StyledSectionLabel variant="labelMd">{sectionLabel}</StyledSectionLabel>

      <Controller
        name="billingMonths"
        control={control}
        render={({ field }) => {
          const selectedMonths = field.value;

          const toggleMonth = (monthId: (typeof BILLING_MONTH_IDS)[number]) => {
            const isSelected = selectedMonths.includes(monthId);
            if (isSelected) {
              field.onChange(selectedMonths.filter(month => month !== monthId));
              return;
            }

            field.onChange([...selectedMonths, monthId]);
          };

          return (
            <Box>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: isMobile
                    ? "repeat(3, minmax(0, 1fr))"
                    : { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, 1fr)", lg: "repeat(6, 1fr)" },
                  gap: isMobile ? 1.5 : 2,
                }}
              >
                {BILLING_MONTH_IDS.map(monthId => {
                  const isChecked = selectedMonths.includes(monthId);
                  const chipLabel = getMonthChipLabel(monthId, labels, variant);

                  if (isMobile) {
                    return (
                      <Box
                        key={monthId}
                        component="button"
                        type="button"
                        onClick={() => {
                          toggleMonth(monthId);
                        }}
                        sx={theme => ({
                          border: `1px solid ${theme.palette.outlineVariant}`,
                          borderRadius: theme.layout.radius.button,
                          py: 1,
                          cursor: "pointer",
                          backgroundColor: isChecked ? theme.palette.primaryContainer : theme.palette.background.paper,
                          color: isChecked ? theme.palette.onPrimaryContainer : theme.palette.onSurfaceVariant,
                          typography: "labelMd",
                          fontWeight: 500,
                          textTransform: "uppercase",
                          transition: "background-color 0.15s ease, border-color 0.15s ease",
                          borderColor: isChecked ? theme.palette.primaryContainer : theme.palette.outlineVariant,
                        })}
                      >
                        {chipLabel}
                      </Box>
                    );
                  }

                  return (
                    <FormControlLabel
                      key={monthId}
                      control={
                        <Checkbox
                          checked={isChecked}
                          onChange={() => {
                            toggleMonth(monthId);
                          }}
                        />
                      }
                      label={chipLabel}
                      sx={theme => ({
                        m: 0,
                        px: 1.5,
                        py: 1,
                        borderRadius: theme.layout.radius.button,
                        border: `1px solid ${theme.palette.border.light}`,
                        backgroundColor: isChecked ? theme.palette.action.selected : theme.palette.background.paper,
                        "&:hover": { backgroundColor: theme.palette.surfaceContainerLow },
                      })}
                    />
                  );
                })}
              </Box>
              {errors.billingMonths?.message ? (
                <FormHelperText error>{errors.billingMonths.message}</FormHelperText>
              ) : null}
            </Box>
          );
        }}
      />
    </Box>
  );
}

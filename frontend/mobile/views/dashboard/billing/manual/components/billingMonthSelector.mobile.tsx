"use client";

import { Box, FormHelperText, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import { BILLING_MONTH_IDS } from "@/frontend/common/views/dashboard/billing/manual/constants/billingMonths";
import type { ManualInvoiceFormData } from "@/frontend/common/views/dashboard/billing/manual/schemas/manualInvoiceSchema";
import type { BillingManualLabels } from "@/shared/locale";

interface BillingMonthSelectorMobileProps {
  readonly control: Control<ManualInvoiceFormData>;
  readonly errors: FieldErrors<ManualInvoiceFormData>;
  readonly labels: BillingManualLabels;
}

const StyledSectionLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
  textTransform: "uppercase",
}));

export function BillingMonthSelectorMobile({ control, errors, labels }: Readonly<BillingMonthSelectorMobileProps>) {
  const sectionLabel = labels.billingMonthsMobile;

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
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 1.5,
                }}
              >
                {BILLING_MONTH_IDS.map(monthId => {
                  const isChecked = selectedMonths.includes(monthId);
                  const chipLabel = monthId.toUpperCase();

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

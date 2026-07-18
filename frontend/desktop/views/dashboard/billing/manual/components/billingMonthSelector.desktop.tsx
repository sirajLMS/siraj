"use client";

import { Box, Checkbox, FormControlLabel, FormHelperText, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Controller } from "react-hook-form";
import { BILLING_MONTH_IDS } from "@/frontend/common/views/dashboard/billing/manual/constants/billingMonths";
import type { BillingMonthSelectorProps } from "@/frontend/common/views/dashboard/billing/manual/types/billingMonthSelector.types";
import type { BillingManualLabels } from "@/shared/locale";

const StyledSectionLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
  textTransform: "uppercase",
}));

export function BillingMonthSelectorDesktop({ control, errors, labels }: Readonly<BillingMonthSelectorProps>) {
  const sectionLabel = labels.billingMonths;

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
                  gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, 1fr)", lg: "repeat(6, 1fr)" },
                  gap: 2,
                }}
              >
                {BILLING_MONTH_IDS.map(monthId => {
                  const isChecked = selectedMonths.includes(monthId);
                  const chipLabel = labels.months[monthId as keyof BillingManualLabels["months"]];

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

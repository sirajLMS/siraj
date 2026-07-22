"use client";

import { Box, FormHelperText } from "@mui/material";
import { Controller } from "react-hook-form";
import { StyledSectionLabel } from "@/frontend/common/views/dashboard/billing/manual/components/billingMonthSelectorShared.styles";
import { BILLING_MONTH_IDS } from "@/frontend/common/views/dashboard/billing/manual/constants/billingMonths";
import type { BillingMonthSelectorSharedProps } from "@/frontend/common/views/dashboard/billing/manual/types/billingMonthSelectorShared.types";

export function BillingMonthSelectorShared({ props, slots }: Readonly<BillingMonthSelectorSharedProps>) {
  const { control, errors, labels } = props;
  const { MonthItem, gridSx, sectionLabelKey, labelFor } = slots;
  const sectionLabel = labels[sectionLabelKey];

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
              <Box sx={{ display: "grid", ...gridSx }}>
                {BILLING_MONTH_IDS.map(monthId => {
                  const isChecked = selectedMonths.includes(monthId);

                  return (
                    <MonthItem
                      key={monthId}
                      monthId={monthId}
                      isChecked={isChecked}
                      onToggle={() => {
                        toggleMonth(monthId);
                      }}
                      label={labelFor(monthId, labels)}
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

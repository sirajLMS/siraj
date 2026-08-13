"use client";

import { Checkbox, FormControlLabel, type SxProps, type Theme } from "@mui/material";
import { BillingMonthSelectorShared } from "@/frontend/common/views/dashboard/billing/manual/components/billingMonthSelectorShared";
import type { BillingMonthItemSlotProps } from "@/frontend/common/views/dashboard/billing/manual/types";
import type { BillingMonthSelectorProps } from "@/frontend/common/views/dashboard/billing/manual/types/billingMonthSelector.types";
import { BILLING_MONTH_IDS, type BillingMonthId } from "@/shared/constants/billing-months";
import type { BillingManualLabels } from "@/shared/locale";

function isBillingMonthId(value: string): value is BillingMonthId {
  return (BILLING_MONTH_IDS as readonly string[]).includes(value);
}

function DesktopMonthItem({ monthId, isChecked, onToggle, label }: Readonly<BillingMonthItemSlotProps>) {
  return (
    <FormControlLabel
      key={monthId}
      control={
        <Checkbox
          checked={isChecked}
          onChange={() => {
            onToggle();
          }}
        />
      }
      label={label}
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
}

const desktopGridSx: SxProps<Theme> = {
  gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, 1fr)", lg: "repeat(6, 1fr)" },
  gap: 2,
};

const desktopLabelFor = (monthId: string, labels: BillingManualLabels): string =>
  isBillingMonthId(monthId) ? labels.months[monthId] : monthId;

export function BillingMonthSelectorDesktop(props: Readonly<BillingMonthSelectorProps>) {
  return (
    <BillingMonthSelectorShared
      props={props}
      slots={{
        MonthItem: DesktopMonthItem,
        gridSx: desktopGridSx,
        sectionLabelKey: "billingMonths",
        labelFor: desktopLabelFor,
      }}
    />
  );
}

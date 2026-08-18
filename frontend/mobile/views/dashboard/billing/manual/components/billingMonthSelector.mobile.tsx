"use client";

import { Button } from "@mui/material";
import { BillingMonthSelectorShared } from "@/frontend/common/views/dashboard/billing/manual/components/billingMonthSelectorShared";
import type {
  BillingMonthItemSlotProps,
  BillingMonthSelectorProps,
} from "@/frontend/common/views/dashboard/billing/manual/types";

function MobileMonthItem({ monthId, isChecked, onToggle, label }: Readonly<BillingMonthItemSlotProps>) {
  return (
    <Button
      key={monthId}
      type="button"
      onClick={() => {
        onToggle();
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
        transition: theme.transitions.create(["background-color", "border-color"], { duration: 150, easing: "ease" }),
        borderColor: isChecked ? theme.palette.primaryContainer : theme.palette.outlineVariant,
        "&:hover": {
          backgroundColor: isChecked ? theme.palette.primaryContainer : theme.palette.background.paper,
          borderColor: isChecked ? theme.palette.primaryContainer : theme.palette.outlineVariant,
        },
      })}
    >
      {label}
    </Button>
  );
}

const mobileGridSx = {
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 1.5,
} as const;

const mobileLabelFor = (monthId: string): string => monthId.toUpperCase();

export function BillingMonthSelectorMobile(props: Readonly<BillingMonthSelectorProps>) {
  return (
    <BillingMonthSelectorShared
      props={props}
      slots={{
        MonthItem: MobileMonthItem,
        gridSx: mobileGridSx,
        sectionLabelKey: "billingMonthsMobile",
        labelFor: mobileLabelFor,
      }}
    />
  );
}

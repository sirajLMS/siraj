import type { SxProps, Theme } from "@mui/material/styles";
import type React from "react";
import type { BillingMonthSelectorProps } from "@/frontend/common/views/dashboard/billing/manual/types/billingMonthSelector.types";
import type { BillingManualLabels } from "@/shared/locale";

export interface BillingMonthItemSlotProps {
  readonly monthId: string;
  readonly isChecked: boolean;
  readonly onToggle: () => void;
  readonly label: string;
}

export type BillingMonthItemSlot = React.ComponentType<BillingMonthItemSlotProps>;

export type BillingMonthSectionLabelKey = "billingMonths" | "billingMonthsMobile";

export type BillingMonthLabelFor = (monthId: string, labels: BillingManualLabels) => string;

export interface BillingMonthSelectorSlotProps {
  readonly MonthItem: BillingMonthItemSlot;
  readonly gridSx: SxProps<Theme>;
  readonly sectionLabelKey: BillingMonthSectionLabelKey;
  readonly labelFor: BillingMonthLabelFor;
}

export interface BillingMonthSelectorSharedProps {
  readonly props: Readonly<BillingMonthSelectorProps>;
  readonly slots: BillingMonthSelectorSlotProps;
}

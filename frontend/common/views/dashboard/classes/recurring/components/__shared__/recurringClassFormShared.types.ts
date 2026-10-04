import type { Theme } from "@mui/material/styles";
import type { ComponentType } from "react";
import type { RecurringClassFormFieldsProps } from "@/frontend/common/views/dashboard/classes/recurring/types";

export interface RecurringClassFormSharedOptions {
  readonly scrollableBodyPaddingScale: number;
  readonly formActionsAlignItems: "stretch" | "flex-end";
  readonly submitButtonSx: (theme: Theme) => Record<string, unknown>;
  readonly submitButtonFullWidth: boolean;
  readonly showSuccessBadgeInline: boolean;
  readonly fieldsComponent: ComponentType<RecurringClassFormFieldsProps>;
}

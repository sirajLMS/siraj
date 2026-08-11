"use client";

import type { SxProps, Theme } from "@mui/material/styles";
import {
  EditCategoryDialogShared,
  type EditCategoryDialogSharedProps,
  type EditCategoryDialogSlotProps,
} from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/editCategoryDialogShared";
import type { EditCategoryDialogProps } from "@/frontend/common/views/dashboard/subjects/home/types";

const FORM_ID = "edit-category-form-mobile";
const TITLE_ID = "edit-category-dialog-title-mobile";

const MOBILE_DIALOG_PROPS = {
  fullScreen: true,
  "aria-labelledby": TITLE_ID,
} as const;

const MOBILE_ACTIONS_SX: SxProps<Theme> = {
  px: 3,
  pb: 3,
  flexDirection: "column",
  gap: 1,
};

const MOBILE_BUTTON_EXTRA_SX = { py: 1.5 } as const;

const MOBILE_SLOTS: EditCategoryDialogSlotProps = {
  dialogProps: MOBILE_DIALOG_PROPS,
  actionsSx: MOBILE_ACTIONS_SX,
  actionButtonsFullWidth: true,
  cancelButtonSx: MOBILE_BUTTON_EXTRA_SX,
  saveButtonSx: MOBILE_BUTTON_EXTRA_SX,
  actionOrder: "save-first",
};

/**
 * EditCategoryDialogMobile — full-screen edit-category dialog with an inline
 * stacked action row (save-first, full-width buttons on narrow screens).
 *
 * Delegates all rendering to `EditCategoryDialogShared`; this file only
 * supplies the mobile-tier slot configuration (full-screen dialog, stacked
 * action row, button order).
 */
export function EditCategoryDialogMobile(props: Readonly<EditCategoryDialogProps>) {
  const sharedProps: EditCategoryDialogSharedProps = {
    ...props,
    slots: MOBILE_SLOTS,
    formId: FORM_ID,
    titleId: TITLE_ID,
  };
  return <EditCategoryDialogShared {...sharedProps} />;
}

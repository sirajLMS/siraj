"use client";

import type { SxProps, Theme } from "@mui/material/styles";
import {
  EditCategoryDialogShared,
  type EditCategoryDialogSharedProps,
  type EditCategoryDialogSlotProps,
} from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/editCategoryDialogShared";
import type { EditCategoryDialogProps } from "@/frontend/common/views/dashboard/subjects/home/types";

const FORM_ID = "edit-category-form-desktop";
const TITLE_ID = "edit-category-dialog-title-desktop";

const DESKTOP_DIALOG_PROPS = {
  fullWidth: true,
  maxWidth: "sm",
  "aria-labelledby": TITLE_ID,
} as const;

const DESKTOP_ACTIONS_SX: SxProps<Theme> = { px: 3, pb: 3 };

const DESKTOP_SLOTS: EditCategoryDialogSlotProps = {
  dialogProps: DESKTOP_DIALOG_PROPS,
  actionsSx: DESKTOP_ACTIONS_SX,
  actionButtonsFullWidth: false,
  cancelButtonSx: undefined,
  saveButtonSx: undefined,
  actionOrder: "cancel-first",
};

/**
 * EditCategoryDialogDesktop — `sm`-width centered edit-category dialog with an
 * inline horizontal action row (cancel-first).
 *
 * Delegates all rendering to `EditCategoryDialogShared`; this file only
 * supplies the desktop-tier slot configuration (dialog size, action layout,
 * button order).
 */
export function EditCategoryDialogDesktop(props: Readonly<EditCategoryDialogProps>) {
  const sharedProps: EditCategoryDialogSharedProps = {
    ...props,
    slots: DESKTOP_SLOTS,
    formId: FORM_ID,
    titleId: TITLE_ID,
  };
  return <EditCategoryDialogShared {...sharedProps} />;
}

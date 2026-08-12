import type { SxProps, Theme } from "@mui/material/styles";
import type { CreateCategoryDialogSlotProps } from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/createCategoryDialogShared";

/** Desktop slot config for create-category dialog — `sm`-width, cancel-first, auto-width buttons. */
export function makeDesktopCreateCategorySlots(titleId: string): CreateCategoryDialogSlotProps {
  return {
    dialogProps: {
      fullWidth: true,
      maxWidth: "sm",
      "aria-labelledby": titleId,
    },
    actionsSx: { px: 3, pb: 3 } satisfies SxProps<Theme>,
    actionButtonsFullWidth: false,
    cancelButtonSx: undefined,
    saveButtonSx: undefined,
    actionOrder: "cancel-first",
  };
}

/** Mobile slot config for create-category dialog — full-screen, save-first, full-width column buttons. */
export function makeMobileCreateCategorySlots(titleId: string): CreateCategoryDialogSlotProps {
  return {
    dialogProps: {
      fullScreen: true,
      "aria-labelledby": titleId,
    },
    actionsSx: {
      px: 3,
      pb: 3,
      flexDirection: "column",
      gap: 1,
    } satisfies SxProps<Theme>,
    actionButtonsFullWidth: true,
    cancelButtonSx: { py: 1.5 },
    saveButtonSx: { py: 1.5 },
    actionOrder: "save-first",
  };
}

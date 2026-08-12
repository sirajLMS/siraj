import type { SxProps, Theme } from "@mui/material/styles";
import type { SubjectFormDialogSlotProps } from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/subjectFormDialogShared";

/** Desktop slot config for subject form dialogs — `sm`-width, cancel-first, auto-width buttons. */
export function makeDesktopSubjectSlots(titleId: string): SubjectFormDialogSlotProps {
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

/** Mobile slot config for subject form dialogs — full-screen, save-first, full-width column buttons. */
export function makeMobileSubjectSlots(titleId: string): SubjectFormDialogSlotProps {
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

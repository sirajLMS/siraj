"use client";

import { Box } from "@mui/material";
import type {
  GeneralUserCreateSharedOptions,
  VmLabels,
} from "@/frontend/common/views/dashboard/users/createUser/__shared__/generalUserCreateShared.helpers";

function FormActions({
  labels,
  isSubmitting,
  options,
  onCancel,
}: Readonly<{
  labels: VmLabels;
  isSubmitting: boolean;
  options: GeneralUserCreateSharedOptions;
  onCancel: () => void;
}>) {
  const { PrimaryPageAction, footerPadding, buttonFullWidth, buttonSx } = options;
  return (
    <Box
      sx={theme => ({
        p: footerPadding,
        backgroundColor: theme.palette.surfaceContainerLow,
        borderRadius: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 2,
      })}
    >
      <PrimaryPageAction type="button" variant="text" onClick={onCancel} fullWidth={buttonFullWidth} sx={buttonSx}>
        {labels.cancelButton}
      </PrimaryPageAction>
      <PrimaryPageAction type="submit" disabled={isSubmitting} fullWidth={buttonFullWidth} sx={buttonSx}>
        {labels.createButton}
      </PrimaryPageAction>
    </Box>
  );
}

export { FormActions };

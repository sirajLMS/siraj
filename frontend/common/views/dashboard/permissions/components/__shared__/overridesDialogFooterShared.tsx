"use client";

import { DialogActions } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { OverridesDialogFooterProps } from "@/frontend/common/views/dashboard/permissions/types";
import { SharedDialogCancelButton, SharedDialogSaveButton } from "./sharedDialogButtons";

const StyledFooterContainer = styled(DialogActions)(({ theme }) => ({
  borderTop: `1px solid ${theme.palette.divider}`,
  padding: `${theme.spacing(2)} ${theme.spacing(3)}`,
}));

export function OverridesDialogFooterShared({
  onClose,
  handleSave,
  isDialogLoading,
  isSaving,
  t,
}: Readonly<OverridesDialogFooterProps>) {
  return (
    <StyledFooterContainer>
      <SharedDialogCancelButton label={t.cancel} disabled={isDialogLoading} onClick={onClose} />
      <SharedDialogSaveButton
        label={t.saveOverrides}
        disabled={isDialogLoading}
        onClick={handleSave}
        loading={isSaving}
      />
    </StyledFooterContainer>
  );
}

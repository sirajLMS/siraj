"use client";

import { Button, CircularProgress, DialogActions } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { OverridesDialogFooterProps } from "@/frontend/common/views/dashboard/permissions/types";

const StyledFooterContainer = styled(DialogActions)(({ theme }) => ({
  borderTop: `1px solid ${theme.palette.divider}`,
  padding: `${theme.spacing(2)} ${theme.spacing(3)}`,
}));

const StyledCancelButton = styled(Button)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontWeight: 700,
  borderRadius: 1.5,
}));

const StyledSaveButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.onPrimary,
  fontWeight: 700,
  borderRadius: 1.5,
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
  },
}));

export function OverridesDialogFooterDesktop({
  onClose,
  handleSave,
  isDialogLoading,
  isSaving,
  t,
}: Readonly<OverridesDialogFooterProps>) {
  return (
    <StyledFooterContainer>
      <StyledCancelButton onClick={onClose} disabled={isDialogLoading} variant="text">
        {t.cancel}
      </StyledCancelButton>
      <StyledSaveButton onClick={handleSave} disabled={isDialogLoading} variant="contained">
        {isSaving ? <CircularProgress size={20} color="inherit" /> : t.saveOverrides}
      </StyledSaveButton>
    </StyledFooterContainer>
  );
}

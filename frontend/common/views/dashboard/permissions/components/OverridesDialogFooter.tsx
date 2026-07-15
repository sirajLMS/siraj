"use client";

import { Button, CircularProgress, DialogActions } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useAppTranslation } from "@/shared/locale/client";

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

interface OverridesDialogFooterProps {
  readonly onClose: () => void;
  readonly handleSave: () => Promise<void>;
  readonly isDialogLoading: boolean;
  readonly isSaving: boolean;
}

export function OverridesDialogFooter({
  onClose,
  handleSave,
  isDialogLoading,
  isSaving,
}: Readonly<OverridesDialogFooterProps>) {
  const t = useAppTranslation("dashboard.permissions");

  return (
    <StyledFooterContainer>
      {/* Cancel Action */}
      <StyledCancelButton onClick={onClose} disabled={isDialogLoading} variant="text">
        {t.cancel}
      </StyledCancelButton>
      {/* Save Action */}
      <StyledSaveButton onClick={handleSave} disabled={isDialogLoading} variant="contained">
        {isSaving ? <CircularProgress size={20} color="inherit" /> : t.saveOverrides}
      </StyledSaveButton>
    </StyledFooterContainer>
  );
}

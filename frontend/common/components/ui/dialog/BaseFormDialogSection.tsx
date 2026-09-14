"use client";

import { Box, Button, CircularProgress, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import type { BaseFormDialogSectionProps } from "@/frontend/common/components/ui/dialog/types/baseFormDialogSection.types";

export function BaseFormDialogSection({
  title,
  titleId,
  icon,
  children,
  cancelLabel,
  confirmLabel,
  confirmLoadingLabel,
  onClose,
  onConfirm,
  formId,
  isLoading,
}: Readonly<BaseFormDialogSectionProps>) {
  return (
    <>
      <DialogTitle
        id={titleId}
        sx={icon ? { pt: 4, display: "flex", flexDirection: "column", alignItems: "center" } : undefined}
      >
        {icon ? (
          <Box
            sx={theme => ({
              width: 64,
              height: 64,
              borderRadius: "50%",
              backgroundColor: theme.palette.primaryContainer,
              color: theme.palette.primary.main,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
            })}
          >
            {icon}
          </Box>
        ) : null}
        <Typography variant="headlineMd" component="span">
          {title}
        </Typography>
      </DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          fullWidth
          onClick={onClose}
          disabled={isLoading}
          sx={theme => ({ py: 1.5, color: theme.palette.text.secondary, fontWeight: 700, borderRadius: 1.5 })}
        >
          {cancelLabel}
        </Button>
        <Button
          fullWidth
          type="submit"
          form={formId}
          onClick={onConfirm}
          disabled={isLoading}
          aria-busy={isLoading}
          variant="contained"
          sx={theme => ({
            py: 1.5,
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.onPrimary,
            fontWeight: 700,
            borderRadius: 1.5,
            "&:hover": { backgroundColor: theme.palette.primary.dark },
          })}
        >
          {isLoading
            ? (confirmLoadingLabel ?? <CircularProgress size={20} sx={theme => ({ color: theme.palette.onPrimary })} />)
            : confirmLabel}
        </Button>
      </DialogActions>
    </>
  );
}

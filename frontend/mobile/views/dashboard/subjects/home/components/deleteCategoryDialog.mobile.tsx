"use client";

import { WarningAmberOutlined } from "@mui/icons-material";
import { Box, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import type { DeleteCategoryDialogProps } from "@/frontend/common/views/dashboard/subjects/home/types";
import { MobileFilterButton, MobilePrimaryPageAction } from "@/frontend/mobile/components/ui/button";
import { useAppTranslation } from "@/shared/locale";

/**
 * DeleteCategoryDialogMobile — full-screen confirmation dialog.
 *
 * Mirrors the visual treatment of the shared `BaseDeleteDialog` (centered
 * warning icon + message + side-by-side confirm/cancel row) but renders
 * full-screen so the confirm/cancel buttons remain reachable above the
 * keyboard on small viewports.
 */
export function DeleteCategoryDialogMobile({
  open,
  onClose,
  onConfirm,
  categoryName,
  isLoading,
}: Readonly<DeleteCategoryDialogProps>) {
  const t = useAppTranslation().dashboardTranslations.subjects;

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      fullScreen
      aria-labelledby="delete-category-dialog-title-mobile"
    >
      <DialogTitle
        id="delete-category-dialog-title-mobile"
        sx={{ pt: 4, display: "flex", flexDirection: "column", alignItems: "center" }}
      >
        <Box
          sx={theme => ({
            width: 64,
            height: 64,
            borderRadius: "50%",
            backgroundColor: theme.palette.errorContainer,
            color: theme.palette.error.main,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 2,
          })}
        >
          <WarningAmberOutlined sx={{ fontSize: 32 }} />
        </Box>
        <Typography variant="headlineMd">{t.deleteCategory}</Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, textAlign: "center" })}>
          {t.deleteCategoryConfirm(categoryName)}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <MobileFilterButton fullWidth onClick={onClose} disabled={isLoading} sx={{ py: 1.5 }}>
          {t.cancel}
        </MobileFilterButton>
        <MobilePrimaryPageAction
          fullWidth
          onClick={onConfirm}
          disabled={isLoading}
          sx={theme => ({
            py: 1.5,
            backgroundColor: theme.palette.error.main,
            color: theme.palette.onError,
            "&:hover": { backgroundColor: theme.palette.error.dark },
          })}
        >
          {isLoading ? "..." : t.deleteCategory}
        </MobilePrimaryPageAction>
      </DialogActions>
    </Dialog>
  );
}

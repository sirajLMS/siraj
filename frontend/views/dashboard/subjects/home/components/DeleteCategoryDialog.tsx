"use client";

import { WarningAmberOutlined } from "@mui/icons-material";
import { Box, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { FilterButton, PrimaryPageAction } from "@/frontend/components/ui";
import type { DeleteCategoryDialogProps } from "../types";

export function DeleteCategoryDialog({
  open,
  onClose,
  onConfirm,
  categoryName,
  isLoading,
}: Readonly<DeleteCategoryDialogProps>) {
  const t = useTranslations("dashboard.subjects");

  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pt: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
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
        <Typography variant="headlineMd">{t("deleteCategory")}</Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, textAlign: "center" })}>
          {t("deleteCategoryConfirm", { name: categoryName })}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <FilterButton fullWidth onClick={onClose} disabled={isLoading} sx={{ py: 1.5 }}>
          {t("cancel")}
        </FilterButton>
        <PrimaryPageAction
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
          {isLoading ? "..." : t("deleteCategory")}
        </PrimaryPageAction>
      </DialogActions>
    </Dialog>
  );
}

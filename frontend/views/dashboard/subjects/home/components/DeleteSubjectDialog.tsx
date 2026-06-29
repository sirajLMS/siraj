"use client";

import { WarningAmberOutlined } from "@mui/icons-material";
import { Box, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { FilterButton, PrimaryPageAction } from "@/frontend/components/ui";
import type { DeleteSubjectDialogProps } from "../types";

export function DeleteSubjectDialog({
  open,
  onClose,
  onConfirm,
  subjectName,
  isLoading,
}: Readonly<DeleteSubjectDialogProps>) {
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
        <Typography variant="headlineMd">{t("deleteSubject")}</Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, textAlign: "center" })}>
          {t("deleteSubjectConfirm", { name: subjectName })}
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
          {isLoading ? "..." : t("deleteSubject")}
        </PrimaryPageAction>
      </DialogActions>
    </Dialog>
  );
}

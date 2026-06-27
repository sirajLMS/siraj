"use client";

import { useMutation } from "@apollo/client/react";
import {
  EditNoteOutlined,
  PersonAddOutlined,
  PersonOffOutlined,
  PhotoCameraOutlined,
  ReceiptLongOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Stack,
  useTheme,
} from "@mui/material";
import { useTranslations } from "next-intl";
import type React from "react";
import { useState } from "react";
import { deactivateParentMutationDocument } from "@/frontend/graphql/sharedDocuments";
import { Link } from "@/shared/i18n/routing";

interface DeactivateParentDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly deactivating: boolean;
  readonly error: { message: string } | null | undefined;
}

const DeactivateParentDialog: React.FC<DeactivateParentDialogProps> = ({
  open,
  onClose,
  onConfirm,
  deactivating,
  error,
}) => {
  const t = useTranslations("dashboard.parentProfile.actions");

  return (
    <Dialog
      open={open}
      onClose={() => !deactivating && onClose()}
      aria-labelledby="deactivate-parent-dialog-title"
      aria-describedby="deactivate-parent-dialog-desc"
    >
      <DialogTitle id="deactivate-parent-dialog-title">{t("deactivateDialogTitle")}</DialogTitle>
      <DialogContent>
        <DialogContentText id="deactivate-parent-dialog-desc">{t("deactivateConfirmText")}</DialogContentText>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error.message}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={deactivating} variant="outlined">
          {t("cancel")}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={deactivating}
          sx={{ backgroundColor: theme => theme.palette.error.main, color: theme => theme.palette.onError }}
          variant="contained"
          startIcon={deactivating ? <CircularProgress size={16} sx={{ color: "inherit" }} /> : undefined}
        >
          {deactivating ? t("deactivating") : t("deactivateAccount")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface ParentProfileActionsProps {
  readonly parentId: string;
  readonly onEditAvatar: () => void;
}

const ParentProfileActions: React.FC<ParentProfileActionsProps> = ({ parentId, onEditAvatar }) => {
  const theme = useTheme();
  const t = useTranslations("dashboard.parentProfile.actions");

  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  const [deactivateParent, { loading: deactivating, error: deactivateError }] = useMutation(
    deactivateParentMutationDocument,
    {
      onCompleted: () => {
        setDeactivateDialogOpen(false);
        setSnackbarMessage(t("deactivateSuccess"));
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      },
      onError: error => {
        setSnackbarMessage(error.message);
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      },
    }
  );

  const handleDeactivateConfirm = () => {
    void deactivateParent({ variables: { parentId } });
  };

  const actionStyle = {
    display: "flex",
    alignItems: "center",
    gap: 1,
    typography: "labelLarge",
    fontWeight: 700,
  } as const;

  return (
    <>
      <Stack
        direction="row"
        spacing={4}
        sx={{
          flexWrap: "wrap",
          pb: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          mb: theme.layout.sectionGap,
        }}
      >
        <Button
          onClick={onEditAvatar}
          startIcon={<PhotoCameraOutlined sx={{ fontSize: 18 }} />}
          sx={{ ...actionStyle, color: theme.palette.primary.main }}
        >
          {t("editPicture")}
        </Button>

        <Link href={`/parents/${parentId}/profile/edit`} style={{ textDecoration: "none" }}>
          <Button
            startIcon={<EditNoteOutlined sx={{ fontSize: 18 }} />}
            sx={{ ...actionStyle, color: theme.palette.primary.main }}
          >
            {t("editProfile")}
          </Button>
        </Link>

        <Link href={`/students/onboarding?parentId=${parentId}`} style={{ textDecoration: "none" }}>
          <Button
            startIcon={<PersonAddOutlined sx={{ fontSize: 18 }} />}
            sx={{ ...actionStyle, color: theme.palette.primary.main }}
          >
            {t("addNewStudent")}
          </Button>
        </Link>

        <Link href={`/billing/invoices?parentId=${parentId}`} style={{ textDecoration: "none" }}>
          <Button
            startIcon={<ReceiptLongOutlined sx={{ fontSize: 18 }} />}
            sx={{ ...actionStyle, color: theme.palette.primary.main }}
          >
            {t("viewInvoices")}
          </Button>
        </Link>

        <Button
          onClick={() => setDeactivateDialogOpen(true)}
          startIcon={<PersonOffOutlined sx={{ fontSize: 18 }} />}
          sx={{
            ...actionStyle,
            color: theme.palette.error.main,
            ml: "auto !important",
          }}
        >
          {t("deactivateAccount")}
        </Button>
      </Stack>

      <DeactivateParentDialog
        open={deactivateDialogOpen}
        onClose={() => setDeactivateDialogOpen(false)}
        onConfirm={handleDeactivateConfirm}
        deactivating={deactivating}
        error={deactivateError}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbarSeverity} onClose={() => setSnackbarOpen(false)} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ParentProfileActions;

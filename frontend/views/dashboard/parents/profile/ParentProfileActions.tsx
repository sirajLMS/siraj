import { useMutation } from "@apollo/client/react";
import {
  EditNoteOutlined,
  PersonAddOutlined,
  PersonOffOutlined,
  PhotoCameraOutlined,
  ReceiptLongOutlined,
  UploadFileOutlined,
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
  Link,
  Snackbar,
  Stack,
  useTheme,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type React from "react";
import { useState } from "react";
import { deactivateParentMutationDocument } from "@/frontend/graphql/sharedDocuments";

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
}

const ParentProfileActions: React.FC<ParentProfileActionsProps> = ({ parentId }) => {
  const theme = useTheme();
  const t = useTranslations("dashboard.parentProfile.actions");
  const router = useRouter();

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
        // Navigate back to parent directory after short delay
        setTimeout(() => router.back(), 1500);
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

  const actionLinks = [
    { label: t("editPicture"), icon: PhotoCameraOutlined, color: theme.palette.primary.main },
    { label: t("editProfile"), icon: EditNoteOutlined, color: theme.palette.primary.main },
    { label: t("uploadDocs"), icon: UploadFileOutlined, color: theme.palette.primary.main },
    { label: t("addNewStudent"), icon: PersonAddOutlined, color: theme.palette.primary.main },
    { label: t("viewInvoices"), icon: ReceiptLongOutlined, color: theme.palette.primary.main },
  ];

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
        {actionLinks.map(({ label, icon: Icon, color }) => (
          <Link
            key={label}
            href="#"
            underline="hover"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              color: color,
              typography: "labelLarge",
              fontWeight: 700,
            }}
          >
            <Icon sx={{ fontSize: 18 }} />
            {label}
          </Link>
        ))}
        <Link
          component="button"
          onClick={() => setDeactivateDialogOpen(true)}
          underline="hover"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: theme.palette.error.main,
            typography: "labelLarge",
            fontWeight: 700,
            ml: "auto !important",
            background: "none",
            border: "none",
            cursor: "pointer",
            p: 0,
          }}
        >
          <PersonOffOutlined sx={{ fontSize: 18 }} />
          {t("deactivateAccount")}
        </Link>
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

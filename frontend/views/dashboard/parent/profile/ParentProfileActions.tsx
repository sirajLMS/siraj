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
  Stack,
} from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { deactivateParentMutationDocument } from "@/frontend/graphql/sharedDocuments";
import { logger } from "@/frontend/utils/logger";
import { profileHrefForParent, profileHrefForUser } from "@/frontend/utils/profileHref";
import { Link, useRouter } from "@/shared/i18n/routing";

interface DeactivateParentDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly deactivating: boolean;
  readonly error: { message: string } | null | undefined;
}

function DeactivateParentDialog({ open, onClose, onConfirm, deactivating, error }: DeactivateParentDialogProps) {
  const t = useTranslations("dashboard.parentProfile.actions");
  const tc = useTranslations("common");

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
            {tc("operationFailed")}
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
}

interface ParentProfileActionsProps {
  readonly parentId: string;
  readonly userId?: string | null;
  readonly onEditAvatar: () => void;
}

function parentProfileEditHref(userId?: string | null, parentId?: string): string | undefined {
  if (userId) {
    return `${profileHrefForUser(userId)}/edit`;
  }
  const profileHref = profileHrefForParent({ parentId });
  return profileHref ? `${profileHref}/edit` : undefined;
}

function ParentProfileActions({ parentId, userId, onEditAvatar }: ParentProfileActionsProps) {
  const t = useTranslations("dashboard.parentProfile.actions");
  const tc = useTranslations("common");
  const router = useRouter();
  const notifications = useNotifications();

  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);

  const [deactivateParent, { loading: deactivating, error: deactivateError }] = useMutation(
    deactivateParentMutationDocument,
    {
      onCompleted: () => {
        setDeactivateDialogOpen(false);
        notifications.show(t("deactivateSuccess"), { severity: "success", autoHideDuration: 4000 });
        router.push("/parents");
      },
      onError: error => {
        logger.error("Deactivate parent failed:", { error });
        notifications.show(tc("operationFailed"), { severity: "error", autoHideDuration: 4000 });
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

  const editProfileHref = parentProfileEditHref(userId, parentId);

  return (
    <>
      <Stack
        direction="row"
        spacing={4}
        sx={theme => ({
          flexWrap: "wrap",
          pb: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          mb: theme.layout.sectionGap,
        })}
      >
        <Button
          onClick={onEditAvatar}
          startIcon={<PhotoCameraOutlined sx={{ fontSize: 18 }} />}
          sx={theme => ({ ...actionStyle, color: theme.palette.primary.main })}
        >
          {t("editPicture")}
        </Button>

        {editProfileHref ? (
          <Link href={editProfileHref} style={{ textDecoration: "none" }}>
            <Button
              startIcon={<EditNoteOutlined sx={{ fontSize: 18 }} />}
              sx={theme => ({ ...actionStyle, color: theme.palette.primary.main })}
            >
              {t("editProfile")}
            </Button>
          </Link>
        ) : (
          <Button
            startIcon={<EditNoteOutlined sx={{ fontSize: 18 }} />}
            sx={theme => ({ ...actionStyle, color: theme.palette.primary.main })}
            disabled
          >
            {t("editProfile")}
          </Button>
        )}

        <Link href={`/students/onboarding?parentId=${parentId}`} style={{ textDecoration: "none" }}>
          <Button
            startIcon={<PersonAddOutlined sx={{ fontSize: 18 }} />}
            sx={theme => ({ ...actionStyle, color: theme.palette.primary.main })}
          >
            {t("addNewStudent")}
          </Button>
        </Link>

        <Link href={`/billing/invoices?parentId=${parentId}`} style={{ textDecoration: "none" }}>
          <Button
            startIcon={<ReceiptLongOutlined sx={{ fontSize: 18 }} />}
            sx={theme => ({ ...actionStyle, color: theme.palette.primary.main })}
          >
            {t("viewInvoices")}
          </Button>
        </Link>

        <Button
          onClick={() => setDeactivateDialogOpen(true)}
          startIcon={<PersonOffOutlined sx={{ fontSize: 18 }} />}
          sx={theme => ({
            ...actionStyle,
            color: theme.palette.error.main,
            ml: "auto !important",
          })}
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
    </>
  );
}

export default ParentProfileActions;

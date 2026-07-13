"use client";

import { useMutation } from "@apollo/client/react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { FormErrorSnackbar, FormSuccessSnackbar } from "@/frontend/common/components/ui";
import { AccountStatus, AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  deactivateParentMutationDocument,
  profileByUserIdQueryDocument,
  reactivateParentMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { getGraphQLErrorMessage } from "@/frontend/common/utils/errorUtils";

type ParentAccountActionsProps = {
  readonly parentId: string;
  readonly targetUserId: string;
  readonly accountStatus: AccountStatus | null | undefined;
};

type AccountActionDialogProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly loading: boolean;
  readonly error: string | null;
  readonly mode: "deactivate" | "reactivate";
};

function AccountActionDialog({ open, onClose, onConfirm, loading, error, mode }: AccountActionDialogProps) {
  const t = useTranslations("profile.parent.actions");
  const isDeactivate = mode === "deactivate";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isDeactivate ? t("deactivateDialogTitle") : t("reactivateDialogTitle")}</DialogTitle>
      <DialogContent>
        <Typography variant="bodyMd">
          {isDeactivate ? t("deactivateConfirmText") : t("reactivateConfirmText")}
        </Typography>
        {error ? (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.error.main, mt: 2 })}>
            {error}
          </Typography>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {t("cancel")}
        </Button>
        <Button onClick={onConfirm} variant="contained" color={isDeactivate ? "error" : "success"} disabled={loading}>
          {loading
            ? isDeactivate
              ? t("deactivating")
              : t("reactivating")
            : isDeactivate
              ? t("deactivateAccount")
              : t("reactivateAccount")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function ParentAccountActions({ parentId, targetUserId, accountStatus }: ParentAccountActionsProps) {
  const t = useTranslations("profile.parent.actions");
  const [dialogMode, setDialogMode] = useState<"deactivate" | "reactivate" | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const refetchProfile = [{ query: profileByUserIdQueryDocument, variables: { userId: targetUserId } }];

  const [deactivateParent, { loading: deactivating }] = useMutation(deactivateParentMutationDocument, {
    refetchQueries: refetchProfile,
    onCompleted: () => {
      setDialogMode(null);
      setMutationError(null);
      setSuccessMessage(t("deactivateSuccess"));
    },
    onError: error => {
      setMutationError(getGraphQLErrorMessage(error, t("deactivateAccount")));
    },
  });

  const [reactivateParent, { loading: reactivating }] = useMutation(reactivateParentMutationDocument, {
    refetchQueries: refetchProfile,
    onCompleted: () => {
      setDialogMode(null);
      setMutationError(null);
      setSuccessMessage(t("reactivateSuccess"));
    },
    onError: error => {
      setMutationError(getGraphQLErrorMessage(error, t("reactivateAccount")));
    },
  });

  const isActivated = accountStatus !== AccountStatus.Deactivated;
  const isLoading = deactivating || reactivating;

  const handleConfirm = () => {
    setMutationError(null);
    if (dialogMode === "deactivate") {
      void deactivateParent({ variables: { parentId } });
      return;
    }
    if (dialogMode === "reactivate") {
      void reactivateParent({ variables: { parentId } });
    }
  };

  return (
    <RequirePermission permissions={[AppPermission.ParentManageStatus]}>
      <Stack direction="row" spacing={1}>
        {isActivated ? (
          <Button variant="outlined" color="error" onClick={() => setDialogMode("deactivate")}>
            {t("deactivateAccount")}
          </Button>
        ) : (
          <Button variant="outlined" color="success" onClick={() => setDialogMode("reactivate")}>
            {t("reactivateAccount")}
          </Button>
        )}
      </Stack>

      {dialogMode ? (
        <AccountActionDialog
          open
          onClose={() => {
            if (!isLoading) {
              setDialogMode(null);
              setMutationError(null);
            }
          }}
          onConfirm={handleConfirm}
          loading={isLoading}
          error={mutationError}
          mode={dialogMode}
        />
      ) : null}

      <FormSuccessSnackbar
        open={Boolean(successMessage)}
        message={successMessage ?? ""}
        onClose={() => setSuccessMessage(null)}
      />
      <FormErrorSnackbar
        open={Boolean(mutationError) && !dialogMode}
        message={mutationError ?? ""}
        onClose={() => setMutationError(null)}
      />
    </RequirePermission>
  );
}

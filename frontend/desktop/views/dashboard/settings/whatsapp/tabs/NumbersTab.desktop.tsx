"use client";

import { AddOutlined, CloudSyncOutlined, DeleteOutlined, EditOutlined, MoreVertOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useState } from "react";
import { PrimaryPageAction } from "@/frontend/common/components/ui";
import { WhatsappAccountPurpose } from "@/frontend/common/graphql/generated/gql/graphql";
import { EmbeddedSignupDialog } from "@/frontend/common/views/dashboard/settings/whatsapp/embeddedSignup";
import {
  NumbersCreateEditDialogs,
  NumbersDeleteConfirmDialog,
  NumbersEmptyStateShared,
  NumbersHeaderShared,
  NumbersListItemTransition,
} from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/__shared__";
import { NumbersSnackbar } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/components/NumbersSnackbar";
import { NumberCard } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/NumberCard";
import { NumberCardField } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/NumberCardContent";
import { syncPulseSx } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/whatsappAnimations";
import type { NumbersTabSharedProps } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps";
import type {
  WhatsappAccountRow,
  WhatsappCreateInput,
  WhatsappDialogState,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

type CredentialDialogField = "accessToken" | "twoStepPin";

interface CredentialDialogState {
  readonly accountId: string;
  readonly field: CredentialDialogField;
  readonly value: string;
}

const INITIAL_DIALOG_STATE: CredentialDialogState = {
  accountId: "",
  field: "accessToken",
  value: "",
};

function CredentialEditDialog({
  open,
  state,
  labels,
  onClose,
  onConfirm,
}: Readonly<{
  readonly open: boolean;
  readonly state: CredentialDialogState;
  readonly labels: WhatsappLabels;
  readonly onClose: () => void;
  readonly onConfirm: (value: string) => Promise<void>;
}>) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleClose = useCallback(() => {
    setValue("");
    onClose();
  }, [onClose]);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm(value);
      setValue("");
    } finally {
      setSubmitting(false);
    }
  };

  const title = state.field === "accessToken" ? labels.editToken : labels.editPin;
  const fieldLabel = state.field === "accessToken" ? labels.accessToken : labels.twoStepPin;
  const placeholder = state.field === "accessToken" ? labels.accessTokenPlaceholder : labels.twoStepPinPlaceholder;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          type="password"
          label={fieldLabel}
          placeholder={placeholder}
          value={value}
          onChange={e => setValue(e.target.value)}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{labels.cancel}</Button>
        <Button variant="contained" disabled={submitting || value.length === 0} onClick={handleConfirm}>
          {submitting ? <CircularProgress size={20} /> : labels.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function AccountIdFields({
  labels,
  account,
}: Readonly<{ readonly labels: WhatsappLabels; readonly account: WhatsappAccountRow }>) {
  return (
    <>
      <NumberCardField label={labels.wabaId} value={account.wabaId ?? "—"} />
      <NumberCardField label={labels.phoneNumberId} value={account.phoneNumberId ?? "—"} />
    </>
  );
}

function AccountsListSection({
  labels,
  accounts,
  deletingId,
  syncingId,
  onMenuOpen,
  onOpenDeleteConfirmDialog,
  onAddAccount,
  onRetrySetup,
}: Readonly<{
  readonly labels: WhatsappLabels;
  readonly accounts: ReadonlyArray<WhatsappAccountRow>;
  readonly deletingId: string | null;
  readonly syncingId: string | null;
  readonly onMenuOpen: (event: React.MouseEvent<HTMLElement>, account: WhatsappAccountRow) => void;
  readonly onOpenDeleteConfirmDialog: (accountId: string, displayName: string) => void;
  readonly onAddAccount: () => void;
  /** Re-opens Embedded Signup from the failed-sync card panel (ES-gated). */
  readonly onRetrySetup?: () => void;
}>) {
  if (accounts.length === 0) {
    return (
      <NumbersEmptyStateShared
        labels={labels}
        cta={
          <PrimaryPageAction startIcon={<AddOutlined />} onClick={onAddAccount}>
            {labels.addFirstNumber}
          </PrimaryPageAction>
        }
      />
    );
  }

  return (
    <Stack spacing={2}>
      {accounts.map((account, index) => {
        const isDeleting = deletingId === account.id;
        const isSyncing = syncingId !== null;
        const accountLabel = account.displayName?.en ?? account.displayPhoneNumber ?? account.id ?? "";
        return (
          <NumbersListItemTransition
            key={account.id ?? account.phoneNumberId ?? index}
            visible={!isDeleting}
            ariaBusy={isDeleting}
          >
            {isDeleting ? <LinearProgress sx={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 1 }} /> : null}
            <NumberCard
              account={account}
              labels={labels}
              onRetrySetup={onRetrySetup}
              syncDeadlineAt={account.syncDeadlineAt}
              syncFailureReason={account.syncFailureReason}
              action={
                <Box>
                  <IconButton
                    aria-label={labels.editAccount}
                    disabled={isDeleting || isSyncing}
                    onClick={e => onMenuOpen(e, account)}
                  >
                    {isDeleting ? <CircularProgress size={20} /> : <MoreVertOutlined />}
                  </IconButton>
                  <IconButton
                    aria-label={labels.deleteAccount}
                    color="error"
                    disabled={isDeleting || isSyncing}
                    onClick={() => {
                      if (account.id) {
                        onOpenDeleteConfirmDialog(account.id, accountLabel);
                      }
                    }}
                  >
                    {isDeleting ? <CircularProgress size={20} /> : <DeleteOutlined />}
                  </IconButton>
                  {isSyncing ? (
                    <Box component="span" sx={{ display: "inline-flex", ml: 0.5, alignItems: "center" }}>
                      <CloudSyncOutlined sx={syncPulseSx} />
                    </Box>
                  ) : null}
                </Box>
              }
              extraMetadata={<AccountIdFields labels={labels} account={account} />}
            />
          </NumbersListItemTransition>
        );
      })}
    </Stack>
  );
}

function AccountActionMenu({
  labels,
  anchorEl,
  onClose,
  onEditName,
  onOpenCredentialDialog,
}: Readonly<{
  readonly labels: WhatsappLabels;
  readonly anchorEl: null | HTMLElement;
  readonly onClose: () => void;
  readonly onEditName: () => void;
  readonly onOpenCredentialDialog: (field: CredentialDialogField) => void;
}>) {
  return (
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
      <MenuItem
        onClick={() => {
          onEditName();
          onClose();
        }}
      >
        <EditOutlined sx={{ mr: 1.5 }} fontSize="small" />
        {labels.editName}
      </MenuItem>
      <MenuItem
        onClick={() => {
          onOpenCredentialDialog("accessToken");
          onClose();
        }}
      >
        {labels.editToken}
      </MenuItem>
      <MenuItem
        onClick={() => {
          onOpenCredentialDialog("twoStepPin");
          onClose();
        }}
      >
        {labels.editPin}
      </MenuItem>
    </Menu>
  );
}

interface CredentialMenuState {
  readonly anchorEl: null | HTMLElement;
  readonly dialogMode: CredentialDialogState;
  readonly dialogOpen: boolean;
  readonly handleMenuOpen: (event: React.MouseEvent<HTMLElement>, account: WhatsappAccountRow) => void;
  readonly handleMenuClose: () => void;
  readonly handleEditNameFromMenu: () => void;
  readonly openCredentialDialog: (field: CredentialDialogField) => void;
  readonly handleDialogClose: () => void;
  readonly handleDialogConfirm: (value: string) => Promise<void>;
}

function useCredentialMenuState(
  onSetAccessToken: (id: string, token: string) => Promise<void>,
  onSetTwoStepPin: (id: string, pin: string) => Promise<void>,
  onOpenEditNameDialog: (accountId: string, displayName: string, purpose: WhatsappAccountPurpose) => void
): CredentialMenuState {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuAccount, setMenuAccount] = useState<WhatsappAccountRow | null>(null);
  const [dialogMode, setDialogMode] = useState<CredentialDialogState>(INITIAL_DIALOG_STATE);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, account: WhatsappAccountRow) => {
    setAnchorEl(event.currentTarget);
    setMenuAccount(account);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleEditNameFromMenu = useCallback(() => {
    if (!menuAccount?.id) return;
    onOpenEditNameDialog(
      menuAccount.id,
      menuAccount.displayName?.en ?? "",
      menuAccount.purpose ?? WhatsappAccountPurpose.General
    );
  }, [menuAccount, onOpenEditNameDialog]);

  const openCredentialDialog = useCallback(
    (field: CredentialDialogField) => {
      if (!menuAccount?.id) return;
      setDialogMode({ accountId: menuAccount.id, field, value: "" });
      setDialogOpen(true);
    },
    [menuAccount]
  );

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleDialogConfirm = useCallback(
    async (value: string) => {
      if (dialogMode.field === "accessToken") {
        await onSetAccessToken(dialogMode.accountId, value);
      } else {
        await onSetTwoStepPin(dialogMode.accountId, value);
      }
      setDialogOpen(false);
    },
    [dialogMode, onSetAccessToken, onSetTwoStepPin]
  );

  return {
    anchorEl,
    dialogMode,
    dialogOpen,
    handleMenuOpen,
    handleMenuClose,
    handleEditNameFromMenu,
    openCredentialDialog,
    handleDialogClose,
    handleDialogConfirm,
  };
}

function NumbersTabDialogs({
  labels,
  dialogState,
  dialogOpen,
  dialogMode,
  creating,
  updatingId,
  mutationError,
  onDeleteAccount,
  onCreate,
  onEditName,
  onUpdatePurpose,
  onCloseDialog,
  handleDialogClose,
  handleDialogConfirm,
  validateDisplayName,
  validatePhoneNumberId,
  validateWabaId,
  validatePurpose,
}: Readonly<{
  readonly labels: WhatsappLabels;
  readonly dialogState: WhatsappDialogState;
  readonly dialogOpen: boolean;
  readonly dialogMode: CredentialDialogState;
  readonly creating: boolean;
  readonly updatingId: string | null;
  readonly mutationError: string | null;
  readonly onDeleteAccount: (id: string) => Promise<void>;
  readonly onCreate: (input: WhatsappCreateInput) => Promise<void>;
  readonly onEditName: (accountId: string, displayName: string) => Promise<void>;
  readonly onUpdatePurpose: (accountId: string, purpose: WhatsappAccountPurpose) => Promise<void>;
  readonly onCloseDialog: () => void;
  readonly handleDialogClose: () => void;
  readonly handleDialogConfirm: (value: string) => Promise<void>;
  readonly validateDisplayName: (value: string) => string | null;
  readonly validatePhoneNumberId: (value: string) => string | null;
  readonly validateWabaId: (value: string) => string | null;
  readonly validatePurpose: (value: string) => string | null;
}>) {
  const t = labels;
  const handleDeleteConfirm = useCallback(async () => {
    const accountId = dialogState.accountId;
    if (!accountId) return;
    await onDeleteAccount(accountId);
    onCloseDialog();
  }, [dialogState.accountId, onDeleteAccount, onCloseDialog]);

  return (
    <>
      <CredentialEditDialog
        open={dialogOpen}
        state={dialogMode}
        labels={t}
        onClose={handleDialogClose}
        onConfirm={handleDialogConfirm}
      />

      <NumbersDeleteConfirmDialog
        open={dialogState.type === "deleteConfirm"}
        displayName={dialogState.displayName ?? ""}
        labels={t}
        onClose={onCloseDialog}
        onConfirm={handleDeleteConfirm}
        fullScreen={false}
      />

      <NumbersCreateEditDialogs
        labels={t}
        dialogState={dialogState}
        creating={creating}
        updatingId={updatingId}
        mutationError={mutationError}
        onCreate={onCreate}
        onEditName={onEditName}
        onUpdatePurpose={onUpdatePurpose}
        onCloseDialog={onCloseDialog}
        validateDisplayName={validateDisplayName}
        validatePhoneNumberId={validatePhoneNumberId}
        validateWabaId={validateWabaId}
        validatePurpose={validatePurpose}
      />
    </>
  );
}

function NumbersHeaderDesktop({
  labels,
  syncing,
  isConfigured,
  syncDisabledReason,
  onSyncFromMeta,
  onOpenCreateDialog,
  esConfigId,
  esAppId,
  onOpenEmbeddedSignup,
  embeddedSignupBlocked,
}: Readonly<{
  readonly labels: WhatsappLabels;
  readonly syncing: boolean;
  readonly isConfigured: boolean;
  readonly syncDisabledReason?: string;
  readonly onSyncFromMeta: () => Promise<void>;
  readonly onOpenCreateDialog: () => void;
  readonly esConfigId?: string | null;
  readonly esAppId?: string | null;
  readonly onOpenEmbeddedSignup?: () => void;
  readonly embeddedSignupBlocked: boolean;
}>) {
  const canConnect = esConfigId && esAppId && onOpenEmbeddedSignup;
  return (
    <NumbersHeaderShared
      labels={labels}
      syncing={syncing}
      isConfigured={isConfigured}
      syncDisabledReason={syncDisabledReason}
      onSyncFromMeta={onSyncFromMeta}
      onAddAccount={onOpenCreateDialog}
      onConnectBusinessApp={canConnect ? () => onOpenEmbeddedSignup?.() : undefined}
      embeddedSignupBlocked={embeddedSignupBlocked}
      buttonSize="medium"
      syncIconSize={20}
      titleSlot={
        <Box>
          <Typography variant="titleLg">{labels.numbersTitle}</Typography>
          <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
            {labels.numbersSubtitle}
          </Typography>
        </Box>
      }
    />
  );
}

export function NumbersTabDesktop({
  labels,
  accounts,
  loading,
  syncing,
  snackbar,
  deletingId,
  syncingId,
  onSetAccessToken,
  onSetTwoStepPin,
  onSyncFromMeta,
  onDeleteAccount,
  onOpenDeleteConfirmDialog,
  onDismissSnackbar,
  isConfigured,
  syncDisabledReason,
  creating,
  updatingId,
  dialogState,
  mutationError,
  onCreate,
  onEditName,
  onUpdatePurpose,
  onOpenCreateDialog,
  onOpenEditNameDialog,
  onCloseDialog,
  validateDisplayName,
  validatePhoneNumberId,
  validateWabaId,
  validatePurpose,
  esConfigId,
  esAppId,
  embeddedSignupBlocked = false,
  embeddedSignupAllowedOriginsUrl = null,
  onOpenEmbeddedSignup,
  onEmbeddedSignupComplete,
}: Readonly<NumbersTabSharedProps>) {
  const t = labels.page;
  const {
    anchorEl,
    dialogMode,
    dialogOpen,
    handleMenuOpen,
    handleMenuClose,
    handleEditNameFromMenu,
    openCredentialDialog,
    handleDialogClose,
    handleDialogConfirm,
  } = useCredentialMenuState(onSetAccessToken, onSetTwoStepPin, onOpenEditNameDialog);

  if (loading) {
    return (
      <Box component="output" sx={{ display: "flex", justifyContent: "center", py: 4 }} aria-busy>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <Box>
      <NumbersHeaderDesktop
        labels={t}
        syncing={syncing}
        isConfigured={isConfigured}
        syncDisabledReason={syncDisabledReason}
        onSyncFromMeta={onSyncFromMeta}
        onOpenCreateDialog={onOpenCreateDialog}
        esConfigId={esConfigId}
        esAppId={esAppId}
        onOpenEmbeddedSignup={onOpenEmbeddedSignup}
        embeddedSignupBlocked={embeddedSignupBlocked}
      />

      <AccountsListSection
        labels={t}
        accounts={accounts}
        deletingId={deletingId}
        syncingId={syncingId}
        onMenuOpen={handleMenuOpen}
        onOpenDeleteConfirmDialog={onOpenDeleteConfirmDialog}
        onAddAccount={onOpenCreateDialog}
        onRetrySetup={esConfigId && esAppId ? onOpenEmbeddedSignup : undefined}
      />

      <AccountActionMenu
        labels={t}
        anchorEl={anchorEl}
        onClose={handleMenuClose}
        onEditName={handleEditNameFromMenu}
        onOpenCredentialDialog={openCredentialDialog}
      />

      <NumbersTabDialogs
        labels={t}
        dialogState={dialogState}
        dialogOpen={dialogOpen}
        dialogMode={dialogMode}
        creating={creating}
        updatingId={updatingId}
        mutationError={mutationError}
        onDeleteAccount={onDeleteAccount}
        onCreate={onCreate}
        onEditName={onEditName}
        onUpdatePurpose={onUpdatePurpose}
        onCloseDialog={onCloseDialog}
        handleDialogClose={handleDialogClose}
        handleDialogConfirm={handleDialogConfirm}
        validateDisplayName={validateDisplayName}
        validatePhoneNumberId={validatePhoneNumberId}
        validateWabaId={validateWabaId}
        validatePurpose={validatePurpose}
      />

      {onEmbeddedSignupComplete ? (
        <EmbeddedSignupDialog
          open={dialogState.type === "embeddedSignup"}
          fullScreen={false}
          labels={t}
          configId={esConfigId ?? null}
          appId={esAppId ?? null}
          allowedOriginsUrl={embeddedSignupAllowedOriginsUrl}
          onComplete={onEmbeddedSignupComplete}
          onClose={onCloseDialog}
        />
      ) : null}

      <NumbersSnackbar state={snackbar} onClose={onDismissSnackbar} />
    </Box>
  );
}

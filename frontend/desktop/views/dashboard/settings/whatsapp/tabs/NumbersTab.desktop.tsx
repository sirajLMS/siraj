"use client";

import { CloudSyncOutlined, DeleteOutlined, EditOutlined, MoreVertOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
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
  useMediaQuery,
} from "@mui/material";
import { useCallback, useState } from "react";
import {
  NumbersCreateEditDialogs,
  NumbersDeleteConfirmDialog,
  NumbersHeaderShared,
  NumbersListItemTransition,
} from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/__shared__";
import { NumbersSnackbar } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/components/NumbersSnackbar";
import { NumberCard } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/NumberCard";
import {
  ROW_DELETE_DURATION,
  ROW_ENTER_DURATION,
  syncPulseSx,
} from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/whatsappAnimations";
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

  const handleConfirm = useCallback(async () => {
    setSubmitting(true);
    try {
      await onConfirm(value);
      setValue("");
    } finally {
      setSubmitting(false);
    }
  }, [value, onConfirm]);

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

function ExtraChipsRow({
  labels,
  account,
}: Readonly<{ readonly labels: WhatsappLabels; readonly account: WhatsappAccountRow }>) {
  return (
    <>
      <Chip size="small" label={`${labels.wabaId}: ${account.wabaId}`} />
      <Chip size="small" label={`${labels.phoneNumberId}: ${account.phoneNumberId}`} />
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
}: Readonly<{
  readonly labels: WhatsappLabels;
  readonly accounts: ReadonlyArray<WhatsappAccountRow>;
  readonly deletingId: string | null;
  readonly syncingId: string | null;
  readonly onMenuOpen: (event: React.MouseEvent<HTMLElement>, account: WhatsappAccountRow) => void;
  readonly onOpenDeleteConfirmDialog: (accountId: string, displayName: string) => void;
}>) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)", { noSsr: true });
  const enterTimeout = reducedMotion ? 0 : ROW_ENTER_DURATION;
  const deleteTimeout = reducedMotion ? 0 : ROW_DELETE_DURATION;

  if (accounts.length === 0) {
    return (
      <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, py: 4, textAlign: "center" }}>
        {labels.noAccounts}
      </Typography>
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
            enterTimeout={enterTimeout}
            deleteTimeout={deleteTimeout}
            ariaBusy={isDeleting}
          >
            {isDeleting ? <LinearProgress sx={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 1 }} /> : null}
            <NumberCard
              account={account}
              labels={labels}
              chipGap={1}
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
              extraChips={<ExtraChipsRow labels={labels} account={account} />}
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
  onOpenEditNameDialog: (accountId: string, displayName: string) => void
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
    onOpenEditNameDialog(menuAccount.id, menuAccount.displayName?.en ?? "");
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
  onCloseDialog,
  handleDialogClose,
  handleDialogConfirm,
  validateDisplayName,
  validatePhoneNumberId,
  validateWabaId,
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
  readonly onCloseDialog: () => void;
  readonly handleDialogClose: () => void;
  readonly handleDialogConfirm: (value: string) => Promise<void>;
  readonly validateDisplayName: (value: string) => string | null;
  readonly validatePhoneNumberId: (value: string) => string | null;
  readonly validateWabaId: (value: string) => string | null;
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
        onCloseDialog={onCloseDialog}
        validateDisplayName={validateDisplayName}
        validatePhoneNumberId={validatePhoneNumberId}
        validateWabaId={validateWabaId}
      />
    </>
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
  creating,
  updatingId,
  dialogState,
  mutationError,
  onCreate,
  onEditName,
  onOpenCreateDialog,
  onOpenEditNameDialog,
  onCloseDialog,
  validateDisplayName,
  validatePhoneNumberId,
  validateWabaId,
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
      <NumbersHeaderShared
        labels={t}
        syncing={syncing}
        isConfigured={isConfigured}
        onSyncFromMeta={onSyncFromMeta}
        onAddAccount={onOpenCreateDialog}
        buttonSize="medium"
        syncIconSize={20}
        titleSlot={
          <Box>
            <Typography variant="titleLg">{t.numbersTitle}</Typography>
            <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
              {t.numbersSubtitle}
            </Typography>
          </Box>
        }
      />

      <AccountsListSection
        labels={t}
        accounts={accounts}
        deletingId={deletingId}
        syncingId={syncingId}
        onMenuOpen={handleMenuOpen}
        onOpenDeleteConfirmDialog={onOpenDeleteConfirmDialog}
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
        onCloseDialog={onCloseDialog}
        handleDialogClose={handleDialogClose}
        handleDialogConfirm={handleDialogConfirm}
        validateDisplayName={validateDisplayName}
        validatePhoneNumberId={validatePhoneNumberId}
        validateWabaId={validateWabaId}
      />

      <NumbersSnackbar state={snackbar} onClose={onDismissSnackbar} />
    </Box>
  );
}

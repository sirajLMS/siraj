"use client";

import { CloudSyncOutlined, DeleteOutlined, MoreVertOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useState } from "react";
import { NumbersSnackbar } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/components/NumbersSnackbar";
import { NumberCard } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/NumberCard";
import type { NumbersTabSharedProps } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps";
import type { WhatsappAccountRow } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
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

interface DeleteDialogState {
  readonly open: boolean;
  readonly accountId: string;
  readonly accountLabel: string;
}

function DeleteConfirmDialog({
  open,
  labels,
  onClose,
  onConfirm,
}: Readonly<{
  readonly open: boolean;
  readonly state: DeleteDialogState;
  readonly labels: WhatsappLabels;
  readonly onClose: () => void;
  readonly onConfirm: () => Promise<void>;
}>) {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = useCallback(async () => {
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  }, [onConfirm]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{labels.deleteAccount}</DialogTitle>
      <DialogContent>
        <DialogContentText>{labels.deleteConfirm}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{labels.cancel}</Button>
        <Button variant="contained" color="error" disabled={submitting} onClick={handleConfirm}>
          {submitting ? <CircularProgress size={20} /> : labels.deleteAccount}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

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

function NumbersHeader({
  labels,
  syncing,
  isConfigured,
  onSyncFromMeta,
}: Readonly<{
  readonly labels: WhatsappLabels;
  readonly syncing: boolean;
  readonly isConfigured: boolean;
  readonly onSyncFromMeta: () => void;
}>) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
      <Box>
        <Typography variant="titleLg">{labels.numbersTitle}</Typography>
        <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
          {labels.numbersSubtitle}
        </Typography>
      </Box>
      <Button
        variant="outlined"
        startIcon={<CloudSyncOutlined />}
        disabled={syncing || !isConfigured}
        onClick={onSyncFromMeta}
      >
        {syncing ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
        {labels.syncFromMeta}
      </Button>
    </Box>
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
  onMenuOpen,
  onDeleteClick,
}: Readonly<{
  readonly labels: WhatsappLabels;
  readonly accounts: ReadonlyArray<WhatsappAccountRow>;
  readonly onMenuOpen: (event: React.MouseEvent<HTMLElement>, accountId: string) => void;
  readonly onDeleteClick: (account: WhatsappAccountRow) => void;
}>) {
  if (accounts.length === 0) {
    return (
      <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, py: 4, textAlign: "center" }}>
        {labels.noAccounts}
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {accounts.map((account, index) => (
        <NumberCard
          key={account.id ?? account.phoneNumberId ?? index}
          account={account}
          labels={labels}
          chipGap={1}
          action={
            <Box>
              <IconButton
                aria-label={labels.editAccount}
                onClick={e => {
                  if (!account.id) return;
                  onMenuOpen(e, account.id);
                }}
              >
                <MoreVertOutlined />
              </IconButton>
              <IconButton aria-label={labels.deleteAccount} color="error" onClick={() => onDeleteClick(account)}>
                <DeleteOutlined />
              </IconButton>
            </Box>
          }
          extraChips={<ExtraChipsRow labels={labels} account={account} />}
        />
      ))}
    </Stack>
  );
}

function AccountActionMenu({
  labels,
  anchorEl,
  onClose,
  onOpenCredentialDialog,
}: Readonly<{
  readonly labels: WhatsappLabels;
  readonly anchorEl: null | HTMLElement;
  readonly onClose: () => void;
  readonly onOpenCredentialDialog: (field: CredentialDialogField) => void;
}>) {
  return (
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
      <MenuItem onClick={() => onOpenCredentialDialog("accessToken")}>{labels.editToken}</MenuItem>
      <MenuItem onClick={() => onOpenCredentialDialog("twoStepPin")}>{labels.editPin}</MenuItem>
    </Menu>
  );
}

export function NumbersTabDesktop({
  labels,
  accounts,
  loading,
  syncing,
  snackbar,
  onSetAccessToken,
  onSetTwoStepPin,
  onSyncFromMeta,
  onDeleteAccount,
  onDismissSnackbar,
  isConfigured,
}: Readonly<NumbersTabSharedProps>) {
  const t = labels.page;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [dialogState, setDialogState] = useState<CredentialDialogState>(INITIAL_DIALOG_STATE);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({ open: false, accountId: "", accountLabel: "" });

  const handleDeleteClick = useCallback((account: WhatsappAccountRow) => {
    if (!account.id) return;
    setDeleteDialog({
      open: true,
      accountId: account.id,
      accountLabel: account.displayName?.en ?? account.displayPhoneNumber ?? account.id,
    });
  }, []);

  const handleDeleteClose = useCallback(() => {
    setDeleteDialog({ open: false, accountId: "", accountLabel: "" });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteDialog.accountId) return;
    await onDeleteAccount(deleteDialog.accountId);
    setDeleteDialog({ open: false, accountId: "", accountLabel: "" });
  }, [deleteDialog.accountId, onDeleteAccount]);

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, accountId: string) => {
    setAnchorEl(event.currentTarget);
    setDialogState(prev => ({ ...prev, accountId }));
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const openCredentialDialog = useCallback((field: CredentialDialogField) => {
    setDialogState(prev => ({ ...prev, field, value: "" }));
    setDialogOpen(true);
    setAnchorEl(null);
  }, []);

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleDialogConfirm = useCallback(
    async (value: string) => {
      if (dialogState.field === "accessToken") {
        await onSetAccessToken(dialogState.accountId, value);
      } else {
        await onSetTwoStepPin(dialogState.accountId, value);
      }
      setDialogOpen(false);
    },
    [dialogState, onSetAccessToken, onSetTwoStepPin]
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <Box>
      <NumbersHeader labels={t} syncing={syncing} isConfigured={isConfigured} onSyncFromMeta={onSyncFromMeta} />

      <AccountsListSection
        labels={t}
        accounts={accounts}
        onMenuOpen={handleMenuOpen}
        onDeleteClick={handleDeleteClick}
      />

      <AccountActionMenu
        labels={t}
        anchorEl={anchorEl}
        onClose={handleMenuClose}
        onOpenCredentialDialog={openCredentialDialog}
      />

      <CredentialEditDialog
        open={dialogOpen}
        state={dialogState}
        labels={t}
        onClose={handleDialogClose}
        onConfirm={handleDialogConfirm}
      />

      <DeleteConfirmDialog
        open={deleteDialog.open}
        state={deleteDialog}
        labels={t}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
      />

      <NumbersSnackbar state={snackbar} onClose={onDismissSnackbar} />
    </Box>
  );
}

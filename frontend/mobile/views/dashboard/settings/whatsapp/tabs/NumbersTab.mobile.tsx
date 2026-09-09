"use client";

import {
  AddOutlined,
  CheckCircleOutlined,
  CloudSyncOutlined,
  DeleteOutlined,
  EditOutlined,
  ErrorOutlined,
  KeyOutlined,
  MoreVertOutlined,
  PasswordOutlined,
  SearchOutlined,
} from "@mui/icons-material";
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
import { useCallback, useEffect, useRef, useState } from "react";
import { WhatsappAccountPurpose } from "@/frontend/common/graphql/generated/gql/graphql";
import type { WhatsappTokenTestResult, WhatsappTokenTestState } from "@/frontend/common/stores/whatsappTokenTestStore";
import { EmbeddedSignupDialog } from "@/frontend/common/views/dashboard/settings/whatsapp/embeddedSignup";
import {
  MetaNumbersLinkShared,
  NumbersCreateEditDialogs,
  NumbersDeleteConfirmDialog,
  NumbersEmptyStateShared,
  NumbersHeaderShared,
  NumbersListItemTransition,
} from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/__shared__";
import { NumbersSnackbar } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/components/NumbersSnackbar";
import { NumberCardContent } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/NumberCardContent";
import { syncPulseSx } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/whatsappAnimations";
import type { NumbersTabSharedProps } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps";
import type { WhatsappAccountRow } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import { MobileCardList, MobileCardListItem, MobilePrimaryPageAction } from "@/frontend/mobile/components/ui";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

type CredentialField = "accessToken" | "twoStepPin";

interface CredentialDialogState {
  readonly accountId: string;
  readonly field: CredentialField;
}

const INITIAL_CRED_STATE: CredentialDialogState = { accountId: "", field: "accessToken" };

type CredentialValidationKey = "validationAccessTokenTooShort" | "validationPinFormat";

const CRED_VALIDATION_KEYS: ReadonlySet<string> = new Set(["validationAccessTokenTooShort", "validationPinFormat"]);

function isCredValidationKey(value: string): value is CredentialValidationKey {
  return CRED_VALIDATION_KEYS.has(value);
}

function resolveCredValidationError(key: string | null, labels: WhatsappLabels): string | null {
  if (key === null) return null;
  return isCredValidationKey(key) ? labels[key] : key;
}

// ── Credential form hook ──

function useCredentialForm() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return { value, setValue, error, setError, submitting, setSubmitting };
}

// ── Credential edit dialog ──

function CredentialEditDialogMobile({
  open,
  state,
  labels,
  onClose,
  onConfirm,
  onTest,
  tokenTestStates,
  loading,
  validate,
}: Readonly<{
  readonly open: boolean;
  readonly state: CredentialDialogState;
  readonly labels: WhatsappLabels;
  readonly onClose: () => void;
  readonly onConfirm: (value: string) => Promise<void>;
  readonly onTest: (accountId: string, token: string) => Promise<WhatsappTokenTestState>;
  readonly tokenTestStates: Readonly<Record<string, Readonly<Record<string, WhatsappTokenTestResult>>>>;
  readonly loading: boolean;
  readonly validate: (value: string) => string | null;
}>) {
  const form = useCredentialForm();
  const onConfirmRef = useRef(onConfirm);
  const onTestRef = useRef(onTest);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    onConfirmRef.current = onConfirm;
  }, [onConfirm]);

  useEffect(() => {
    onTestRef.current = onTest;
  }, [onTest]);

  const handleClose = useCallback(() => {
    form.setValue("");
    form.setError(null);
    onClose();
  }, [form, onClose]);

  const handleConfirm = useCallback(async () => {
    const err = resolveCredValidationError(validate(form.value), labels);
    form.setError(err);
    if (err !== null) return;
    form.setSubmitting(true);
    try {
      await onConfirmRef.current(form.value);
      form.setValue("");
    } finally {
      form.setSubmitting(false);
    }
  }, [form, validate, labels]);

  const handleFieldChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      form.setValue(e.target.value);
      form.setError(resolveCredValidationError(validate(e.target.value), labels));
    },
    [form, validate, labels]
  );

  const handleTest = async () => {
    if (testing || form.value.length === 0) return;
    setTesting(true);
    try {
      await onTestRef.current(state.accountId, form.value);
    } finally {
      setTesting(false);
    }
  };

  const isToken = state.field === "accessToken";
  const title = isToken ? labels.editToken : labels.editPin;
  const fieldLabel = isToken ? labels.accessToken : labels.twoStepPin;
  const placeholder = isToken ? labels.accessTokenPlaceholder : labels.twoStepPinPlaceholder;
  const busy = form.submitting || loading;
  const tokenTestResult = isToken ? tokenTestStates[state.accountId]?.[form.value] : undefined;
  const testState = tokenTestResult?.state;
  const testReason = tokenTestResult?.reason ?? null;
  const testFailed = testState === "failed";
  const fieldError = form.error !== null || testFailed;
  const fieldHelperText = testFailed ? testReason : form.error;

  const saveDisabled = isToken
    ? busy || testing || form.value.length === 0 || testState !== "success"
    : busy || form.value.length === 0;

  return (
    <Dialog open={open} onClose={handleClose} fullScreen>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            type="password"
            label={fieldLabel}
            placeholder={placeholder}
            value={form.value}
            onChange={handleFieldChange}
            error={fieldError}
            helperText={fieldHelperText ?? undefined}
            aria-invalid={fieldError}
            disabled={busy}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={busy}>
          {labels.cancel}
        </Button>
        {isToken ? (
          <MobileTestButton
            testing={testing}
            testState={testState}
            disabled={form.value.length === 0}
            labels={labels}
            onTest={handleTest}
          />
        ) : null}
        <Button variant="contained" disabled={saveDisabled} onClick={handleConfirm}>
          {form.submitting || loading ? <CircularProgress size={20} /> : labels.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Test action button (mobile) whose color/icon/text reflects the token's test state. */
function MobileTestButton({
  testing,
  testState,
  disabled,
  labels,
  onTest,
}: Readonly<{
  readonly testing: boolean;
  readonly testState: WhatsappTokenTestState | undefined;
  readonly disabled: boolean;
  readonly labels: WhatsappLabels;
  readonly onTest: () => void;
}>) {
  if (testing) {
    return (
      <Button disabled startIcon={<CircularProgress size={16} />}>
        {labels.testRunning}
      </Button>
    );
  }
  if (testState === "success") {
    return (
      <Button color="success" onClick={onTest} startIcon={<CheckCircleOutlined />}>
        {labels.testPassed}
      </Button>
    );
  }
  if (testState === "failed") {
    return (
      <Button color="error" onClick={onTest} startIcon={<ErrorOutlined />}>
        {labels.testFailed}
      </Button>
    );
  }
  return (
    <Button onClick={onTest} disabled={disabled} startIcon={<SearchOutlined />}>
      {labels.test}
    </Button>
  );
}

// ── Header ──

function NumbersHeaderMobile({
  labels,
  syncing,
  isConfigured,
  syncDisabledReason,
  onSyncFromMeta,
  onAddAccount,
  onConnectBusinessApp,
  embeddedSignupBlocked,
}: Readonly<{
  readonly labels: WhatsappLabels;
  readonly syncing: boolean;
  readonly isConfigured: boolean;
  readonly syncDisabledReason?: string;
  readonly onSyncFromMeta: () => void;
  readonly onAddAccount: () => void;
  readonly onConnectBusinessApp?: () => void;
  readonly embeddedSignupBlocked: boolean;
}>) {
  return (
    <NumbersHeaderShared
      labels={labels}
      syncing={syncing}
      isConfigured={isConfigured}
      syncDisabledReason={syncDisabledReason}
      onSyncFromMeta={onSyncFromMeta}
      onAddAccount={onAddAccount}
      onConnectBusinessApp={onConnectBusinessApp}
      embeddedSignupBlocked={embeddedSignupBlocked}
      compactActions
      buttonSize="small"
      syncIconSize={16}
      titleSlot={
        <Typography variant="titleLg" noWrap sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          {labels.numbersTitle}
        </Typography>
      }
    />
  );
}

// ── Action menu ──

function AccountActionMenuMobile({
  labels,
  anchorEl,
  onClose,
  onEditName,
  onEditToken,
  onEditPin,
  onDelete,
}: Readonly<{
  readonly labels: WhatsappLabels;
  readonly anchorEl: null | HTMLElement;
  readonly onClose: () => void;
  readonly onEditName: () => void;
  readonly onEditToken: () => void;
  readonly onEditPin: () => void;
  readonly onDelete: () => void;
}>) {
  const handleClick = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
      <MenuItem onClick={() => handleClick(onEditName)}>
        <EditOutlined sx={{ mr: 1.5 }} fontSize="small" />
        {labels.editName}
      </MenuItem>
      <MenuItem onClick={() => handleClick(onEditToken)}>
        <KeyOutlined sx={{ mr: 1.5 }} fontSize="small" />
        {labels.editToken}
      </MenuItem>
      <MenuItem onClick={() => handleClick(onEditPin)}>
        <PasswordOutlined sx={{ mr: 1.5 }} fontSize="small" />
        {labels.editPin}
      </MenuItem>
      <MenuItem onClick={() => handleClick(onDelete)} sx={theme => ({ color: theme.palette.error.main })}>
        <DeleteOutlined sx={{ mr: 1.5 }} fontSize="small" />
        {labels.deleteAccount}
      </MenuItem>
    </Menu>
  );
}

// ── Accounts list section ──

interface AccountsListMobileProps {
  readonly labels: WhatsappLabels;
  readonly accounts: ReadonlyArray<WhatsappAccountRow>;
  readonly deletingId: string | null;
  readonly syncingId: string | null;
  readonly updatingId: string | null;
  readonly editingTokenForId: string | null;
  readonly editingPinForId: string | null;
  readonly onMenuOpen: (event: React.MouseEvent<HTMLElement>, account: WhatsappAccountRow) => void;
  readonly onAddAccount: () => void;
  /** Re-opens Embedded Signup from the failed-sync card panel (ES-gated). */
  readonly onRetrySetup?: () => void;
}

function isCardBusy(
  accountId: string | null | undefined,
  deletingId: string | null,
  updatingId: string | null,
  editingTokenForId: string | null,
  editingPinForId: string | null
): boolean {
  if (!accountId) return false;
  return (
    deletingId === accountId ||
    updatingId === accountId ||
    editingTokenForId === accountId ||
    editingPinForId === accountId
  );
}

function AccountsListMobile({
  labels,
  accounts,
  deletingId,
  syncingId,
  updatingId,
  editingTokenForId,
  editingPinForId,
  onMenuOpen,
  onAddAccount,
  onRetrySetup,
}: Readonly<AccountsListMobileProps>) {
  const renderItem = useCallback(
    (account: WhatsappAccountRow) => {
      const isDeleting = deletingId === account.id;
      const isSyncing = syncingId !== null;
      const isBusy = isCardBusy(account.id, deletingId, updatingId, editingTokenForId, editingPinForId);
      return (
        <NumbersListItemTransition visible={!isDeleting} ariaBusy={isBusy}>
          <MobileCardListItem variant="rounded">
            {isBusy ? <LinearProgress sx={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 1 }} /> : null}
            <NumberCardContent
              account={account}
              labels={labels}
              onRetrySetup={onRetrySetup}
              syncDeadlineAt={account.syncDeadlineAt}
              syncFailureReason={account.syncFailureReason}
              action={
                <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                  <IconButton
                    size="small"
                    aria-label={labels.editAccount}
                    disabled={isBusy || isSyncing || !account.id}
                    onClick={e => onMenuOpen(e, account)}
                  >
                    {isBusy ? <CircularProgress size={18} /> : <MoreVertOutlined />}
                  </IconButton>
                  {isSyncing ? (
                    <Box component="span" sx={{ display: "inline-flex", alignItems: "center" }}>
                      <CloudSyncOutlined sx={syncPulseSx} fontSize="small" />
                    </Box>
                  ) : null}
                </Box>
              }
            />
          </MobileCardListItem>
        </NumbersListItemTransition>
      );
    },
    [deletingId, syncingId, updatingId, editingTokenForId, editingPinForId, labels, onMenuOpen, onRetrySetup]
  );

  const renderEmptyState = useCallback(
    () => (
      <NumbersEmptyStateShared
        labels={labels}
        cta={
          <MobilePrimaryPageAction startIcon={<AddOutlined />} onClick={onAddAccount}>
            {labels.addFirstNumber}
          </MobilePrimaryPageAction>
        }
      />
    ),
    [labels, onAddAccount]
  );

  return (
    <MobileCardList
      rows={accounts}
      renderItem={renderItem}
      getKey={account => account.id ?? account.phoneNumberId ?? account.displayPhoneNumber ?? ""}
      emptyMessage={labels.noAccounts}
      renderEmptyState={renderEmptyState}
      paginationOptions={{ mode: "client", pageSize: 10 }}
      gap={1.5}
      layout="rounded"
    />
  );
}

// ── Credential menu state hook ──

interface MobileCredMenuState {
  readonly menuAnchorEl: null | HTMLElement;
  readonly menuAccount: WhatsappAccountRow | null;
  readonly credDialogOpen: boolean;
  readonly credDialogState: CredentialDialogState;
  readonly handleMenuOpen: (event: React.MouseEvent<HTMLElement>, account: WhatsappAccountRow) => void;
  readonly handleMenuClose: () => void;
  readonly openCredDialog: (field: CredentialField) => void;
  readonly handleCredDialogClose: () => void;
  readonly handleCredDialogConfirm: (value: string) => Promise<void>;
}

function useMobileCredMenuState(
  onSetAccessToken: (id: string, token: string) => Promise<void>,
  onSetTwoStepPin: (id: string, pin: string) => Promise<void>
): MobileCredMenuState {
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuAccount, setMenuAccount] = useState<WhatsappAccountRow | null>(null);
  const [credDialogOpen, setCredDialogOpen] = useState(false);
  const [credDialogState, setCredDialogState] = useState<CredentialDialogState>(INITIAL_CRED_STATE);

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, account: WhatsappAccountRow) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuAccount(account);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchorEl(null);
  }, []);

  const openCredDialog = useCallback(
    (field: CredentialField) => {
      if (!menuAccount?.id) return;
      setCredDialogState({ accountId: menuAccount.id, field });
      setCredDialogOpen(true);
    },
    [menuAccount]
  );

  const handleCredDialogClose = useCallback(() => {
    setCredDialogOpen(false);
  }, []);

  const handleCredDialogConfirm = useCallback(
    async (value: string) => {
      if (credDialogState.field === "accessToken") {
        await onSetAccessToken(credDialogState.accountId, value);
      } else {
        await onSetTwoStepPin(credDialogState.accountId, value);
      }
      setCredDialogOpen(false);
    },
    [credDialogState, onSetAccessToken, onSetTwoStepPin]
  );

  return {
    menuAnchorEl,
    menuAccount,
    credDialogOpen,
    credDialogState,
    handleMenuOpen,
    handleMenuClose,
    openCredDialog,
    handleCredDialogClose,
    handleCredDialogConfirm,
  };
}

// ── Skeleton loading ──

function SkeletonAccountCard() {
  return (
    <Box sx={{ position: "relative" }}>
      <LinearProgress sx={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 1 }} />
      <Box
        sx={{
          p: 2,
          borderRadius: 1,
          border: theme => `1px solid ${theme.palette.divider}`,
          opacity: 0.6,
        }}
      >
        <Typography variant="bodyMd" sx={{ mb: 1 }}>
          &nbsp;
        </Typography>
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          <Box sx={theme => ({ width: 80, height: 20, bgcolor: theme.palette.action.hover, borderRadius: 1 })} />
          <Box sx={theme => ({ width: 100, height: 20, bgcolor: theme.palette.action.hover, borderRadius: 1 })} />
        </Box>
      </Box>
    </Box>
  );
}

// ── Main component ──

/**
 * Mobile numbers tab with full CRUD: add, edit name, edit token, edit PIN,
 * delete, and sync. Uses per-card action menu (MoreVert → Menu) for all
 * account actions. All dialogs are fullScreen on mobile for optimal UX.
 */
export function NumbersTabMobile({
  labels,
  accounts,
  loading,
  syncing,
  snackbar,
  deletingId,
  syncingId,
  onSetAccessToken,
  onSetTwoStepPin,
  onTestAccessToken,
  tokenTestStates,
  onSyncFromMeta,
  onDeleteAccount,
  onOpenDeleteConfirmDialog,
  onDismissSnackbar,
  isConfigured,
  syncDisabledReason,
  editingTokenForId,
  editingPinForId,
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
  validateAccessToken,
  validateTwoStepPin,
  esConfigId,
  esAppId,
  onOpenEmbeddedSignup,
  embeddedSignupBlocked = false,
  embeddedSignupAllowedOriginsUrl = null,
  onEmbeddedSignupComplete,
}: Readonly<NumbersTabSharedProps>) {
  const t = labels.page;
  const credMenu = useMobileCredMenuState(onSetAccessToken, onSetTwoStepPin);

  const handleDeleteConfirm = useCallback(async () => {
    const accountId = dialogState.accountId;
    if (!accountId) return;
    await onDeleteAccount(accountId);
    onCloseDialog();
  }, [dialogState.accountId, onDeleteAccount, onCloseDialog]);

  const handleEditNameFromMenu = useCallback(() => {
    if (!credMenu.menuAccount?.id) return;
    onOpenEditNameDialog(
      credMenu.menuAccount.id,
      credMenu.menuAccount.displayName?.en ?? "",
      credMenu.menuAccount.purpose ?? WhatsappAccountPurpose.General
    );
  }, [credMenu.menuAccount, onOpenEditNameDialog]);

  const handleEditTokenFromMenu = useCallback(() => {
    credMenu.openCredDialog("accessToken");
  }, [credMenu]);

  const handleEditPinFromMenu = useCallback(() => {
    credMenu.openCredDialog("twoStepPin");
  }, [credMenu]);

  const handleDeleteFromMenu = useCallback(() => {
    if (!credMenu.menuAccount?.id) return;
    const accountLabel =
      credMenu.menuAccount.displayName?.en ?? credMenu.menuAccount.displayPhoneNumber ?? credMenu.menuAccount.id ?? "";
    onOpenDeleteConfirmDialog(credMenu.menuAccount.id, accountLabel);
  }, [credMenu.menuAccount, onOpenDeleteConfirmDialog]);

  if (loading) {
    return (
      <Box component="output" sx={{ p: 2 }} aria-busy>
        <Stack spacing={1.5}>
          <SkeletonAccountCard />
          <SkeletonAccountCard />
        </Stack>
      </Box>
    );
  }

  const credValidate = credMenu.credDialogState.field === "accessToken" ? validateAccessToken : validateTwoStepPin;
  const credLoading =
    (editingTokenForId !== null && editingTokenForId === credMenu.credDialogState.accountId) ||
    (editingPinForId !== null && editingPinForId === credMenu.credDialogState.accountId);

  return (
    <Box sx={{ p: 2 }}>
      <NumbersHeaderMobile
        labels={t}
        syncing={syncing}
        isConfigured={isConfigured}
        syncDisabledReason={syncDisabledReason}
        onSyncFromMeta={onSyncFromMeta}
        onAddAccount={onOpenCreateDialog}
        embeddedSignupBlocked={embeddedSignupBlocked}
        onConnectBusinessApp={
          esConfigId && esAppId && onOpenEmbeddedSignup
            ? () => {
                onOpenEmbeddedSignup();
              }
            : undefined
        }
      />

      <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, mb: 2 }}>
        {t.numbersSubtitle}
      </Typography>

      <MetaNumbersLinkShared labels={t} />

      <AccountsListMobile
        labels={t}
        accounts={accounts}
        deletingId={deletingId}
        syncingId={syncingId}
        updatingId={updatingId}
        editingTokenForId={editingTokenForId}
        editingPinForId={editingPinForId}
        onMenuOpen={credMenu.handleMenuOpen}
        onAddAccount={onOpenCreateDialog}
        onRetrySetup={esConfigId && esAppId ? onOpenEmbeddedSignup : undefined}
      />

      <AccountActionMenuMobile
        labels={t}
        anchorEl={credMenu.menuAnchorEl}
        onClose={credMenu.handleMenuClose}
        onEditName={handleEditNameFromMenu}
        onEditToken={handleEditTokenFromMenu}
        onEditPin={handleEditPinFromMenu}
        onDelete={handleDeleteFromMenu}
      />

      <NumbersDeleteConfirmDialog
        open={dialogState.type === "deleteConfirm"}
        displayName={dialogState.displayName ?? ""}
        labels={t}
        onClose={onCloseDialog}
        onConfirm={handleDeleteConfirm}
        fullScreen={true}
      />

      <CredentialEditDialogMobile
        key={`${credMenu.credDialogState.accountId}-${credMenu.credDialogState.field}`}
        open={credMenu.credDialogOpen}
        state={credMenu.credDialogState}
        labels={t}
        onClose={credMenu.handleCredDialogClose}
        onConfirm={credMenu.handleCredDialogConfirm}
        onTest={onTestAccessToken}
        tokenTestStates={tokenTestStates}
        loading={credLoading}
        validate={credValidate}
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

      {onEmbeddedSignupComplete ? (
        <EmbeddedSignupDialog
          open={dialogState.type === "embeddedSignup"}
          fullScreen={true}
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

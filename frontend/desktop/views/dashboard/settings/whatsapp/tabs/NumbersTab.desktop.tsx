"use client";

import {
  AddOutlined,
  CheckCircleOutlined,
  CloudSyncOutlined,
  DeleteOutlined,
  EditOutlined,
  ErrorOutlined,
  MoreVertOutlined,
  SearchOutlined,
  VisibilityOffOutlined,
  VisibilityOutlined,
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
  InputAdornment,
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
  onTest,
  tokenTestStates,
}: Readonly<{
  readonly open: boolean;
  readonly state: CredentialDialogState;
  readonly labels: WhatsappLabels;
  readonly onClose: () => void;
  readonly onConfirm: (value: string) => Promise<void>;
  readonly onTest: (accountId: string, token: string) => Promise<WhatsappTokenTestState>;
  readonly tokenTestStates: Readonly<Record<string, Readonly<Record<string, WhatsappTokenTestResult>>>>;
}>) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const handleClose = useCallback(() => {
    setValue("");
    setShowToken(false);
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

  const handleTest = async () => {
    if (testing || value.length === 0) return;
    setTesting(true);
    try {
      await onTest(state.accountId, value);
    } finally {
      setTesting(false);
    }
  };

  const isToken = state.field === "accessToken";
  const title = state.field === "accessToken" ? labels.editToken : labels.editPin;
  const fieldLabel = state.field === "accessToken" ? labels.accessToken : labels.twoStepPin;
  const placeholder = state.field === "accessToken" ? labels.accessTokenPlaceholder : labels.twoStepPinPlaceholder;
  const tokenTestResult = isToken ? tokenTestStates[state.accountId]?.[value] : undefined;
  const testState = tokenTestResult?.state;
  const testReason = tokenTestResult?.reason ?? null;
  const testFailed = testState === "failed";

  // For the token dialog, Save is gated on a successful test of the CURRENT
  // value; for the PIN dialog, only non-empty and not submitting.
  const saveDisabled = isToken
    ? submitting || testing || value.length === 0 || testState !== "success"
    : submitting || value.length === 0;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          type={showToken ? "text" : "password"}
          label={fieldLabel}
          placeholder={placeholder}
          value={value}
          onChange={e => setValue(e.target.value)}
          error={testFailed}
          helperText={testFailed ? testReason : undefined}
          aria-invalid={testFailed}
          sx={{ mt: 1 }}
          slotProps={{
            input: {
              endAdornment: isToken ? (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showToken ? labels.hideToken : labels.showToken}
                    onClick={() => setShowToken(previous => !previous)}
                    edge="end"
                  >
                    {showToken ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            },
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{labels.cancel}</Button>
        {isToken ? (
          <TestButton
            testing={testing}
            testState={testState}
            disabled={value.length === 0}
            labels={labels}
            onTest={handleTest}
          />
        ) : null}
        <Button variant="contained" disabled={saveDisabled} onClick={handleConfirm}>
          {submitting ? <CircularProgress size={20} /> : labels.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Test action button whose color/icon/text reflects the token's test state. */
function TestButton({
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

interface NumbersTabDialogHandlers {
  readonly onDeleteAccount: (id: string) => Promise<void>;
  readonly onCreate: (input: WhatsappCreateInput) => Promise<void>;
  readonly onEditName: (accountId: string, displayName: string) => Promise<void>;
  readonly onUpdatePurpose: (accountId: string, purpose: WhatsappAccountPurpose) => Promise<void>;
  readonly onCloseDialog: () => void;
  readonly handleDialogClose: () => void;
  readonly handleDialogConfirm: (value: string) => Promise<void>;
}

interface NumbersTabDialogValidators {
  readonly validateDisplayName: (value: string) => string | null;
  readonly validatePhoneNumberId: (value: string) => string | null;
  readonly validateWabaId: (value: string) => string | null;
  readonly validatePurpose: (value: string) => string | null;
}

function NumbersTabDialogs({
  labels,
  dialogState,
  dialogOpen,
  dialogMode,
  creating,
  updatingId,
  mutationError,
  onTestAccessToken,
  tokenTestStates,
  handlers,
  validators,
}: Readonly<{
  readonly labels: WhatsappLabels;
  readonly dialogState: WhatsappDialogState;
  readonly dialogOpen: boolean;
  readonly dialogMode: CredentialDialogState;
  readonly creating: boolean;
  readonly updatingId: string | null;
  readonly mutationError: string | null;
  readonly onTestAccessToken: (accountId: string, token: string) => Promise<WhatsappTokenTestState>;
  readonly tokenTestStates: Readonly<Record<string, Readonly<Record<string, WhatsappTokenTestResult>>>>;
  readonly handlers: NumbersTabDialogHandlers;
  readonly validators: NumbersTabDialogValidators;
}>) {
  const t = labels;
  const {
    onDeleteAccount,
    onCloseDialog,
    handleDialogClose,
    handleDialogConfirm,
    onCreate,
    onEditName,
    onUpdatePurpose,
  } = handlers;
  const { validateDisplayName, validatePhoneNumberId, validateWabaId, validatePurpose } = validators;

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
        onTest={onTestAccessToken}
        tokenTestStates={tokenTestStates}
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

function NumbersDesktopBody({
  props,
  anchorEl,
  dialogMode,
  dialogOpen,
  handleMenuOpen,
  handleMenuClose,
  handleEditNameFromMenu,
  openCredentialDialog,
  handleDialogClose,
  handleDialogConfirm,
}: Readonly<{
  props: Readonly<NumbersTabSharedProps>;
  anchorEl: HTMLElement | null;
  dialogMode: CredentialDialogState;
  dialogOpen: boolean;
  handleMenuOpen: (event: React.MouseEvent<HTMLElement>, account: WhatsappAccountRow) => void;
  handleMenuClose: () => void;
  handleEditNameFromMenu: () => void;
  openCredentialDialog: (field: CredentialDialogField) => void;
  handleDialogClose: () => void;
  handleDialogConfirm: (value: string) => Promise<void>;
}>) {
  const t = props.labels.page;
  return (
    <Box>
      <NumbersHeaderDesktop
        labels={t}
        syncing={props.syncing}
        isConfigured={props.isConfigured}
        syncDisabledReason={props.syncDisabledReason}
        onSyncFromMeta={props.onSyncFromMeta}
        onOpenCreateDialog={props.onOpenCreateDialog}
        esConfigId={props.esConfigId}
        esAppId={props.esAppId}
        onOpenEmbeddedSignup={props.onOpenEmbeddedSignup}
        embeddedSignupBlocked={props.embeddedSignupBlocked ?? false}
      />

      <MetaNumbersLinkShared labels={t} />

      <AccountsListSection
        labels={t}
        accounts={props.accounts}
        deletingId={props.deletingId}
        syncingId={props.syncingId}
        onMenuOpen={handleMenuOpen}
        onOpenDeleteConfirmDialog={props.onOpenDeleteConfirmDialog}
        onAddAccount={props.onOpenCreateDialog}
        onRetrySetup={props.esConfigId && props.esAppId ? props.onOpenEmbeddedSignup : undefined}
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
        dialogState={props.dialogState}
        dialogOpen={dialogOpen}
        dialogMode={dialogMode}
        creating={props.creating}
        updatingId={props.updatingId}
        mutationError={props.mutationError}
        onTestAccessToken={props.onTestAccessToken}
        tokenTestStates={props.tokenTestStates}
        handlers={{
          onDeleteAccount: props.onDeleteAccount,
          onCreate: props.onCreate,
          onEditName: props.onEditName,
          onUpdatePurpose: props.onUpdatePurpose,
          onCloseDialog: props.onCloseDialog,
          handleDialogClose,
          handleDialogConfirm,
        }}
        validators={{
          validateDisplayName: props.validateDisplayName,
          validatePhoneNumberId: props.validatePhoneNumberId,
          validateWabaId: props.validateWabaId,
          validatePurpose: props.validatePurpose,
        }}
      />

      {props.onEmbeddedSignupComplete ? (
        <EmbeddedSignupDialog
          open={props.dialogState.type === "embeddedSignup"}
          fullScreen={false}
          labels={t}
          configId={props.esConfigId ?? null}
          appId={props.esAppId ?? null}
          allowedOriginsUrl={props.embeddedSignupAllowedOriginsUrl ?? null}
          onComplete={props.onEmbeddedSignupComplete}
          onClose={props.onCloseDialog}
        />
      ) : null}

      <NumbersSnackbar state={props.snackbar} onClose={props.onDismissSnackbar} />
    </Box>
  );
}

export function NumbersTabDesktop(props: Readonly<NumbersTabSharedProps>) {
  const { onSetAccessToken, onSetTwoStepPin, onOpenEditNameDialog, loading } = props;
  const menuState = useCredentialMenuState(onSetAccessToken, onSetTwoStepPin, onOpenEditNameDialog);

  if (loading) {
    return (
      <Box component="output" sx={{ display: "flex", justifyContent: "center", py: 4 }} aria-busy>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return <NumbersDesktopBody props={props} {...menuState} />;
}

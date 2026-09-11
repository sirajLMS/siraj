"use client";

import { AddOutlined, DeleteOutlineOutlined, PersonAddAlt1Outlined, VerifiedUserOutlined } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui";
import { PhoneInput } from "@/frontend/common/components/ui/input/phoneInput/PhoneInput";
import { META_WHATSAPP_API_SETUP_URL } from "@/frontend/common/views/dashboard/whatsapp/conversations/TestNumberBanner";
import type {
  WhatsappRecipientPanelLabels,
  WhatsappRecipientViewRow,
  WhatsappTestNumberBannerLabels,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";

export interface TestRecipientsPanelProps {
  readonly labels: WhatsappRecipientPanelLabels;
  readonly bannerLabels: WhatsappTestNumberBannerLabels;
  readonly canManage: boolean;
  readonly rows: readonly WhatsappRecipientViewRow[];
  readonly loading: boolean;
  readonly limitReached: boolean;
  readonly notice: string | null;
  readonly verifyingRecipientId: string | null;
  readonly addOpen: boolean;
  readonly addPhone: string;
  readonly addPhoneValid: boolean;
  readonly addNote: string;
  readonly addError: string | null;
  readonly busy: boolean;
  readonly removeTarget: WhatsappRecipientViewRow | null;
  readonly removeConfirmText: string;
  readonly onOpenAdd: () => void;
  readonly onCloseAdd: () => void;
  readonly onAddPhoneChange: (value: string) => void;
  readonly onAddNoteChange: (value: string) => void;
  readonly onSubmitAdd: () => void;
  readonly onAskRemove: (recipientId: string) => void;
  readonly onCloseRemove: () => void;
  readonly onConfirmRemove: () => void;
  readonly onVerify: (recipientId: string) => void;
}

const ADD_DIALOG_ID = "whatsapp-add-test-recipient-dialog";
const REMOVE_DIALOG_ID = "whatsapp-remove-test-recipient-dialog";

function RecipientStatusLine({ row }: Readonly<{ row: WhatsappRecipientViewRow }>) {
  return (
    <Stack spacing={0.5}>
      <StatusBadge category="syncStatus" status={row.statusBadgeStatus} label={row.statusLabel} />
      {row.lastCheckedText !== null && row.lastCheckedText !== "" && (
        <Typography variant="caption" sx={{ color: theme => theme.palette.text.secondary }}>
          {row.lastCheckedText}
        </Typography>
      )}
      {row.errorText !== null && row.errorText !== "" && (
        <Typography variant="caption" sx={{ color: theme => theme.palette.warning.main }}>
          {row.errorText}
        </Typography>
      )}
    </Stack>
  );
}

interface RecipientRowProps {
  readonly row: WhatsappRecipientViewRow;
  readonly labels: WhatsappRecipientPanelLabels;
  readonly canManage: boolean;
  readonly verifying: boolean;
  readonly onAskRemove: (recipientId: string) => void;
  readonly onVerify: (recipientId: string) => void;
}

function RecipientRow({ row, labels, canManage, verifying, onAskRemove, onVerify }: Readonly<RecipientRowProps>) {
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={1.5}
      sx={{
        px: 2,
        py: 1.5,
        alignItems: { xs: "stretch", md: "center" },
        borderTop: theme => `1px solid ${theme.palette.outlineVariant}`,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="bodyMd" dir="ltr" sx={{ fontWeight: 600, unicodeBidi: "isolate", textAlign: "start" }}>
          {row.phoneNumber}
        </Typography>
        {row.note !== null && row.note !== "" && (
          <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
            {row.note}
          </Typography>
        )}
      </Box>
      <RecipientStatusLine row={row} />
      {canManage && (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => onVerify(row.id)}
            disabled={verifying}
            startIcon={verifying ? <CircularProgress size={14} /> : <VerifiedUserOutlined />}
          >
            {labels.recipientVerify}
          </Button>
          <IconButton aria-label={labels.recipientRemove} onClick={() => onAskRemove(row.id)} size="small">
            <DeleteOutlineOutlined />
          </IconButton>
        </Stack>
      )}
    </Stack>
  );
}

function AddRecipientDialog({
  labels,
  open,
  phone,
  phoneValid,
  note,
  error,
  busy,
  onClose,
  onPhoneChange,
  onNoteChange,
  onSubmit,
}: Readonly<{
  labels: WhatsappRecipientPanelLabels;
  open: boolean;
  phone: string;
  phoneValid: boolean;
  note: string;
  error: string | null;
  busy: boolean;
  onClose: () => void;
  onPhoneChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onSubmit: () => void;
}>) {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby={ADD_DIALOG_ID} maxWidth="xs" fullWidth>
      <DialogTitle id={ADD_DIALOG_ID}>{labels.addRecipientDialogTitle}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <PhoneInput
            label={labels.recipientPhoneLabel}
            placeholder={labels.recipientPhonePlaceholder}
            value={phone === "" ? null : phone}
            onChangeAction={value => onPhoneChange(value ?? "")}
            fullWidth
          />
          <TextField
            size="small"
            fullWidth
            label={labels.recipientNoteLabel}
            placeholder={labels.recipientNotePlaceholder}
            value={note}
            onChange={event => onNoteChange(event.target.value)}
          />
          {error !== null && error !== "" && (
            <Alert severity="error" component="div">
              {error}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          {labels.dialogCancel}
        </Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={busy || !phoneValid}
          startIcon={busy ? <CircularProgress size={16} /> : undefined}
        >
          {labels.dialogSave}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function RemoveRecipientDialog({
  labels,
  open,
  confirmText,
  busy,
  onClose,
  onConfirm,
}: Readonly<{
  labels: WhatsappRecipientPanelLabels;
  open: boolean;
  confirmText: string;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}>) {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby={REMOVE_DIALOG_ID} maxWidth="xs" fullWidth>
      <DialogTitle id={REMOVE_DIALOG_ID}>{labels.removeRecipientDialogTitle}</DialogTitle>
      <DialogContent>
        <Typography variant="bodyMd">{confirmText}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          {labels.dialogCancel}
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={busy}
          startIcon={busy ? <CircularProgress size={16} /> : undefined}
        >
          {labels.recipientRemove}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

type PanelActionProps = Pick<TestRecipientsPanelProps, "labels" | "canManage" | "limitReached" | "onOpenAdd">;

function PanelHeader({ labels, canManage, limitReached, onOpenAdd }: Readonly<PanelActionProps>) {
  return (
    <Stack direction="row" spacing={1} sx={{ p: 2, alignItems: "center", justifyContent: "space-between" }}>
      <Typography variant="titleLg">{labels.recipientsTitle}</Typography>
      {canManage && (
        <Button size="small" variant="outlined" startIcon={<AddOutlined />} onClick={onOpenAdd} disabled={limitReached}>
          {labels.recipientAdd}
        </Button>
      )}
    </Stack>
  );
}

function PanelLoadingSkeletons() {
  return (
    <Stack spacing={1} sx={{ px: 2, pb: 2 }} aria-busy>
      <Skeleton variant="rounded" height={56} />
      <Skeleton variant="rounded" height={56} />
    </Stack>
  );
}

function PanelEmptyState({ labels, canManage, limitReached, onOpenAdd }: Readonly<PanelActionProps>) {
  return (
    <Stack spacing={1.25} sx={{ px: 2, py: 5, alignItems: "center", textAlign: "center" }}>
      <PersonAddAlt1Outlined sx={{ fontSize: 36, color: theme => theme.palette.text.secondary }} />
      <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
        {labels.recipientsEmptyTitle}
      </Typography>
      <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
        {labels.recipientsEmptyDescription}
      </Typography>
      {canManage && (
        <Button
          size="small"
          variant="contained"
          startIcon={<AddOutlined />}
          onClick={onOpenAdd}
          disabled={limitReached}
        >
          {labels.recipientAdd}
        </Button>
      )}
    </Stack>
  );
}

type PanelBodyProps = Pick<
  TestRecipientsPanelProps,
  | "labels"
  | "canManage"
  | "rows"
  | "loading"
  | "limitReached"
  | "notice"
  | "verifyingRecipientId"
  | "onOpenAdd"
  | "onAskRemove"
  | "onVerify"
>;

function PanelBody({
  labels,
  canManage,
  rows,
  loading,
  limitReached,
  notice,
  verifyingRecipientId,
  onOpenAdd,
  onAskRemove,
  onVerify,
}: Readonly<PanelBodyProps>) {
  if (loading) {
    return <PanelLoadingSkeletons />;
  }
  return (
    <>
      {notice !== null && notice !== "" && (
        <Alert severity="error" component="div" sx={{ mx: 2, mb: 1.5 }}>
          {notice}
        </Alert>
      )}
      {rows.length === 0 ? (
        <PanelEmptyState labels={labels} canManage={canManage} limitReached={limitReached} onOpenAdd={onOpenAdd} />
      ) : (
        rows.map(row => (
          <RecipientRow
            key={row.id}
            row={row}
            labels={labels}
            canManage={canManage}
            verifying={verifyingRecipientId === row.id}
            onAskRemove={onAskRemove}
            onVerify={onVerify}
          />
        ))
      )}
    </>
  );
}

function MetaDashboardHintLink({ bannerLabels }: Readonly<{ bannerLabels: WhatsappTestNumberBannerLabels }>) {
  return (
    <Box sx={{ px: 2, py: 1.5, borderTop: theme => `1px dashed ${theme.palette.outlineVariant}` }}>
      <Link
        href={META_WHATSAPP_API_SETUP_URL}
        target="_blank"
        rel="noopener noreferrer"
        variant="bodyMd"
        sx={{ color: theme => theme.palette.info.main }}
      >
        {bannerLabels.metaDashboardLinkText}
      </Link>
    </Box>
  );
}

/**
 * Test-recipient registry panel for Meta test numbers: rows with verification
 * status, verify/remove row actions (manage permission only), the add dialog
 * (blocked once the 5-recipient limit is reached), and a footer hint pointing
 * to the authoritative recipients list in the Meta App Dashboard.
 */
export function TestRecipientsPanel(props: Readonly<TestRecipientsPanelProps>) {
  const { labels, bannerLabels, canManage, limitReached, onOpenAdd } = props;
  return (
    <Stack sx={{ borderRadius: 2, overflow: "hidden", border: theme => `1px solid ${theme.palette.outlineVariant}` }}>
      <PanelHeader labels={labels} canManage={canManage} limitReached={limitReached} onOpenAdd={onOpenAdd} />
      <PanelBody {...props} />
      <MetaDashboardHintLink bannerLabels={bannerLabels} />
      <AddRecipientDialog
        labels={labels}
        open={props.addOpen}
        phone={props.addPhone}
        phoneValid={props.addPhoneValid}
        note={props.addNote}
        error={props.addError}
        busy={props.busy}
        onClose={props.onCloseAdd}
        onPhoneChange={props.onAddPhoneChange}
        onNoteChange={props.onAddNoteChange}
        onSubmit={props.onSubmitAdd}
      />
      <RemoveRecipientDialog
        labels={labels}
        open={props.removeTarget !== null}
        confirmText={props.removeConfirmText}
        busy={props.busy}
        onClose={props.onCloseRemove}
        onConfirm={props.onConfirmRemove}
      />
    </Stack>
  );
}

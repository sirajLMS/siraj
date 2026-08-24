"use client";

import { useMutation } from "@apollo/client/react";
import { AccessTimeOutlined, CancelOutlined, ScheduleOutlined, SendOutlined } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";
import {
  requestSessionCancelMutationDocument,
  requestSessionDelayMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { type SelfServiceRescheduleLabels, Translation, useAppTranslation } from "@/shared/locale";

interface SessionActionsProps {
  /** The class instance ID for this session. */
  readonly classInstanceId: string;
  /** The scheduled start time of the session (ISO string). */
  readonly scheduledStartAt: string;
  /** Whether the session is within the time-lock window (disables actions). */
  readonly locked: boolean;
  /** Compact mode for mobile (icon-only buttons). */
  readonly compact?: boolean;
}

type DialogMode = "delay" | "cancel" | null;

function DelayDialog({
  open,
  onClose,
  onSubmit,
  submitting,
  error,
  labels,
}: Readonly<{
  open: boolean;
  onClose: () => void;
  onSubmit: (proposedStartAt: string, reason: string) => void;
  submitting: boolean;
  error: string | null;
  labels: SelfServiceRescheduleLabels;
}>) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <ScheduleOutlined fontSize="small" />
        {labels.delayModal.title}
      </DialogTitle>
      <DialogContent>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            id="delay-proposed-start"
            label={labels.delayModal.proposedStartAt}
            type="datetime-local"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            id="delay-reason"
            label={labels.delayModal.reason}
            placeholder={labels.delayModal.reasonPlaceholder}
            multiline
            rows={3}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          {labels.delayModal.cancel}
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SendOutlined />}
          disabled={submitting}
          onClick={() => {
            const dateEl = document.getElementById("delay-proposed-start");
            const reasonEl = document.getElementById("delay-reason");
            const dateVal = dateEl instanceof HTMLInputElement ? dateEl.value : "";
            const reasonVal =
              reasonEl instanceof HTMLInputElement || reasonEl instanceof HTMLTextAreaElement ? reasonEl.value : "";
            if (dateVal) onSubmit(new Date(dateVal).toISOString(), reasonVal.trim());
          }}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          {labels.delayModal.submit}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function CancelDialog({
  open,
  onClose,
  onSubmit,
  submitting,
  error,
  labels,
}: Readonly<{
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  submitting: boolean;
  error: string | null;
  labels: SelfServiceRescheduleLabels;
}>) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <CancelOutlined fontSize="small" />
        {labels.cancelConfirm.title}
      </DialogTitle>
      <DialogContent>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}
        <Typography variant="body2" sx={theme => ({ color: theme.palette.text.secondary, mb: 2 })}>
          {labels.cancelConfirm.message}
        </Typography>
        <TextField
          id="cancel-reason"
          label={labels.cancelConfirm.reason}
          placeholder={labels.cancelConfirm.reasonPlaceholder}
          multiline
          rows={3}
          fullWidth
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          {labels.cancelConfirm.cancel}
        </Button>
        <Button
          variant="contained"
          color="error"
          startIcon={<CancelOutlined />}
          disabled={submitting}
          onClick={() => {
            const el = document.getElementById("cancel-reason");
            const reason = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement ? el.value.trim() : "";
            onSubmit(reason);
          }}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          {labels.cancelConfirm.confirm}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function LockedActions({
  compact,
  labels,
}: Readonly<{
  compact: boolean;
  labels: SelfServiceRescheduleLabels;
}>) {
  return (
    <Tooltip title={labels.errors.sessionLocked} arrow>
      <Box component="span" sx={{ display: "inline-flex" }}>
        {compact ? (
          <Stack direction="row" spacing={0.5}>
            <IconButton size="small" disabled aria-label={labels.buttons.delay}>
              <AccessTimeOutlined fontSize="small" />
            </IconButton>
            <IconButton size="small" disabled aria-label={labels.buttons.cancel}>
              <CancelOutlined fontSize="small" />
            </IconButton>
          </Stack>
        ) : (
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              disabled
              startIcon={<AccessTimeOutlined />}
              sx={{ borderRadius: 2, textTransform: "none" }}
            >
              {labels.buttons.delay}
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              disabled
              startIcon={<CancelOutlined />}
              sx={{ borderRadius: 2, textTransform: "none" }}
            >
              {labels.buttons.cancel}
            </Button>
          </Stack>
        )}
      </Box>
    </Tooltip>
  );
}

function ActionButtons({
  compact,
  labels,
  onOpenDelay,
  onOpenCancel,
}: Readonly<{
  compact: boolean;
  labels: SelfServiceRescheduleLabels;
  onOpenDelay: () => void;
  onOpenCancel: () => void;
}>) {
  if (compact) {
    return (
      <Stack direction="row" spacing={0.5}>
        <IconButton size="small" color="primary" onClick={onOpenDelay} aria-label={labels.buttons.delay}>
          <AccessTimeOutlined fontSize="small" />
        </IconButton>
        <IconButton size="small" color="error" onClick={onOpenCancel} aria-label={labels.buttons.cancel}>
          <CancelOutlined fontSize="small" />
        </IconButton>
      </Stack>
    );
  }

  return (
    <Stack direction="row" spacing={1}>
      <Button
        size="small"
        variant="outlined"
        color="primary"
        startIcon={<AccessTimeOutlined />}
        onClick={onOpenDelay}
        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
      >
        {labels.buttons.delay}
      </Button>
      <Button
        size="small"
        variant="outlined"
        color="error"
        startIcon={<CancelOutlined />}
        onClick={onOpenCancel}
        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
      >
        {labels.buttons.cancel}
      </Button>
    </Stack>
  );
}

export function SessionActions({
  classInstanceId,
  scheduledStartAt: _scheduledStartAt,
  locked,
  compact = false,
}: Readonly<SessionActionsProps>) {
  const labels = useAppTranslation(Translation.Dashboard.SelfServiceReschedule);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [error, setError] = useState<string | null>(null);

  const [submitDelay, { loading: delayLoading }] = useMutation(requestSessionDelayMutationDocument);
  const [submitCancel, { loading: cancelLoading }] = useMutation(requestSessionCancelMutationDocument);

  const executeMutation = async (mutate: () => Promise<unknown>) => {
    setError(null);
    try {
      await mutate();
      setDialogMode(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  };

  const handleSubmitDelay = (proposedStartAt: string, reason: string) => {
    void executeMutation(() =>
      submitDelay({
        variables: { input: { classInstanceId, proposedStartAt, reason: reason || null } },
      })
    );
  };

  const handleSubmitCancel = (reason: string) => {
    void executeMutation(() =>
      submitCancel({
        variables: { input: { classInstanceId, reason: reason || null } },
      })
    );
  };

  const handleClose = () => {
    setDialogMode(null);
    setError(null);
  };

  if (locked) {
    return <LockedActions compact={compact} labels={labels} />;
  }

  return (
    <>
      <ActionButtons
        compact={compact}
        labels={labels}
        onOpenDelay={() => setDialogMode("delay")}
        onOpenCancel={() => setDialogMode("cancel")}
      />
      <DelayDialog
        open={dialogMode === "delay"}
        onClose={handleClose}
        onSubmit={handleSubmitDelay}
        submitting={delayLoading}
        error={error}
        labels={labels}
      />
      <CancelDialog
        open={dialogMode === "cancel"}
        onClose={handleClose}
        onSubmit={handleSubmitCancel}
        submitting={cancelLoading}
        error={error}
        labels={labels}
      />
    </>
  );
}

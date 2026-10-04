"use client";

import { SendOutlined } from "@mui/icons-material";
import { Alert, Box, Button, CircularProgress, Typography } from "@mui/material";
import { WhatsappConversationSendMode } from "@/frontend/common/graphql/generated/gql/graphql";
import type { ComposerSharedProps } from "@/frontend/common/views/dashboard/whatsapp/conversations/ComposerShared";

type ComposerFooterProps = Readonly<
  Pick<
    ComposerSharedProps,
    | "labels"
    | "mode"
    | "windowOpen"
    | "windowStatusHint"
    | "showRecipientPicker"
    | "sendBlockReason"
    | "sendDisabled"
    | "sendError"
    | "sending"
    | "onSend"
  >
>;

export function ComposerFooter({
  labels,
  mode,
  windowOpen,
  windowStatusHint,
  showRecipientPicker,
  sendBlockReason,
  sendDisabled,
  sendError,
  sending,
  onSend,
}: ComposerFooterProps) {
  const showWindowHint = windowStatusHint !== "" && mode === WhatsappConversationSendMode.Text;
  const windowClosed = !windowOpen && !showRecipientPicker && showWindowHint;
  return (
    <>
      {showWindowHint && (
        <Typography
          variant="bodyMd"
          sx={{ color: theme => (windowClosed ? theme.palette.warning.main : theme.palette.text.secondary) }}
        >
          {windowStatusHint}
        </Typography>
      )}
      {sendBlockReason !== null && sendBlockReason !== "" && (
        <Typography variant="bodyMd" sx={{ color: theme => theme.palette.warning.main }}>
          {sendBlockReason}
        </Typography>
      )}
      {sendError !== null && (
        <Alert severity="error" component="div">
          <Typography variant="bodyMd" sx={{ fontWeight: 600 }}>
            {labels.sendErrorTitle}
          </Typography>
          <Typography variant="bodyMd">{sendError}</Typography>
        </Alert>
      )}
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          onClick={onSend}
          disabled={sending || sendDisabled}
          startIcon={sending ? <CircularProgress size={16} /> : <SendOutlined />}
        >
          {labels.sendButton}
        </Button>
      </Box>
    </>
  );
}

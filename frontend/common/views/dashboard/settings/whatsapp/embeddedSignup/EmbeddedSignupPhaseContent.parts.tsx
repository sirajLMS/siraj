"use client";

import { Alert, AlertTitle, Box, Button, CircularProgress, Typography } from "@mui/material";
import { EmbeddedSignupAllowedOriginsGuidance } from "@/frontend/common/views/dashboard/settings/whatsapp/embeddedSignup/EmbeddedSignupAllowedOriginsGuidance";
import type { EmbeddedSignupPhase } from "@/frontend/common/views/dashboard/settings/whatsapp/embeddedSignup/embeddedSignupTypes";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

export function EmbeddedSignupBusyBlock({ title, body }: Readonly<{ title: string; body: string }>) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, py: 2 }} aria-busy>
      <CircularProgress size={32} />
      <Typography variant="titleLg">{title}</Typography>
      <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, textAlign: "center" }}>
        {body}
      </Typography>
    </Box>
  );
}

/** Minimum app version note + background sync expectations. */
export function EmbeddedSignupGuidance({ labels }: Readonly<{ labels: WhatsappLabels }>) {
  return (
    <>
      <Typography variant="labelMd" sx={{ color: theme => theme.palette.text.secondary }}>
        {labels.embeddedSignupVersionNote}
      </Typography>
      <Alert severity="info" variant="outlined">
        {labels.embeddedSignupSyncInfo}
      </Alert>
    </>
  );
}

export function EmbeddedSignupFailedContent({
  phase,
  labels,
  onRetry,
}: Readonly<{
  readonly phase: EmbeddedSignupPhase;
  readonly labels: WhatsappLabels;
  readonly onRetry: () => void;
}>) {
  const cancelled = phase === "cancelled";
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Alert severity="error">
        <AlertTitle>{cancelled ? labels.embeddedSignupCancelledTitle : labels.embeddedSignupErrorTitle}</AlertTitle>
        {cancelled ? labels.embeddedSignupCancelledBody : labels.embeddedSignupErrorBody}
      </Alert>
      <Button variant="outlined" onClick={onRetry} sx={{ alignSelf: "flex-start" }}>
        {labels.embeddedSignupRetry}
      </Button>
    </Box>
  );
}

export function EmbeddedSignupSuccessContent({ labels }: Readonly<{ labels: WhatsappLabels }>) {
  return (
    <Box component="output" sx={{ display: "block" }}>
      <Typography variant="titleLg">{labels.embeddedSignupSuccessTitle}</Typography>
      <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
        {labels.embeddedSignupSuccessBody}
      </Typography>
    </Box>
  );
}

export function EmbeddedSignupLaunchContent({
  labels,
  allowedOriginsUrl,
  onLaunch,
}: Readonly<{
  readonly labels: WhatsappLabels;
  readonly allowedOriginsUrl: string | null;
  readonly onLaunch: () => void;
}>) {
  return (
    <>
      <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
        {labels.embeddedSignupDescription}
      </Typography>
      {allowedOriginsUrl ? <EmbeddedSignupAllowedOriginsGuidance labels={labels} url={allowedOriginsUrl} /> : null}
      <Button
        variant="contained"
        onClick={onLaunch}
        sx={{ alignSelf: "flex-start", whiteSpace: { sm: "nowrap" }, textAlign: "center" }}
      >
        {labels.embeddedSignupLaunch}
      </Button>
    </>
  );
}

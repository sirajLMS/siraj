"use client";

/**
 * Instruction region of the Embedded Signup dialog: renders the body copy,
 * progress/error surfaces, and guidance (version note + background-sync
 * info alert) for the active step of the ES session state machine.
 */

import { Alert, AlertTitle, Box, Button, CircularProgress, Typography } from "@mui/material";
import type { EmbeddedSignupPhase } from "@/frontend/common/views/dashboard/settings/whatsapp/embeddedSignup/embeddedSignupTypes";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

export interface EmbeddedSignupPhaseContentProps {
  readonly phase: EmbeddedSignupPhase;
  readonly labels: WhatsappLabels;
  /** Restarts the flow (FB.login) from the idle surface. */
  readonly onLaunch: () => void;
  /** Resets the session back to the idle surface. */
  readonly onRetry: () => void;
}

function BusyBlock({ title, body }: Readonly<{ title: string; body: string }>) {
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
function Guidance({ labels }: Readonly<{ labels: WhatsappLabels }>) {
  return (
    <>
      <Typography variant="labelMd" sx={{ color: theme => theme.palette.text.secondary }}>
        {labels.embeddedSignupVersionNote}
      </Typography>
      <Alert severity="info">{labels.embeddedSignupSyncInfo}</Alert>
    </>
  );
}

function FailedContent({
  phase,
  labels,
  onRetry,
}: Readonly<Pick<EmbeddedSignupPhaseContentProps, "phase" | "labels" | "onRetry">>) {
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

export function EmbeddedSignupPhaseContent({
  phase,
  labels,
  onLaunch,
  onRetry,
}: Readonly<EmbeddedSignupPhaseContentProps>) {
  if (phase === "cancelled" || phase === "error") {
    return <FailedContent phase={phase} labels={labels} onRetry={onRetry} />;
  }
  if (phase === "submitting") {
    return <BusyBlock title={labels.embeddedSignupCompletingTitle} body={labels.embeddedSignupCompletingBody} />;
  }
  if (phase === "success") {
    return (
      <Box component="output" sx={{ display: "block" }}>
        <Typography variant="titleLg">{labels.embeddedSignupSuccessTitle}</Typography>
        <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
          {labels.embeddedSignupSuccessBody}
        </Typography>
      </Box>
    );
  }
  // idle | waiting — pairing finishes inside the Meta window / Business app.
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {phase === "waiting" ? (
        <BusyBlock title={labels.embeddedSignupWaitingTitle} body={labels.embeddedSignupWaitingBody} />
      ) : (
        <>
          <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
            {labels.embeddedSignupDescription}
          </Typography>
          <Button
            variant="contained"
            onClick={onLaunch}
            sx={{ alignSelf: "flex-start", whiteSpace: { sm: "nowrap" }, textAlign: "center" }}
          >
            {labels.embeddedSignupLaunch}
          </Button>
        </>
      )}
      <Guidance labels={labels} />
    </Box>
  );
}

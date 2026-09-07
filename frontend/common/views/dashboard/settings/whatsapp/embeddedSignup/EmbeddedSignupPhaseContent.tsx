"use client";

/**
 * Instruction region of the Embedded Signup dialog: renders the body copy,
 * progress/error surfaces, and guidance (version note + background-sync
 * info alert) for the active step of the ES session state machine.
 */

import InfoOutlined from "@mui/icons-material/InfoOutlined";
import OpenInNewOutlined from "@mui/icons-material/OpenInNewOutlined";
import { Alert, AlertTitle, Box, Button, CircularProgress, Typography } from "@mui/material";
import type { EmbeddedSignupPhase } from "@/frontend/common/views/dashboard/settings/whatsapp/embeddedSignup/embeddedSignupTypes";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

export interface EmbeddedSignupPhaseContentProps {
  readonly phase: EmbeddedSignupPhase;
  readonly labels: WhatsappLabels;
  /** Meta App Dashboard settings URL for registering allowed origins (null → guidance hidden). */
  readonly allowedOriginsUrl?: string | null;
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
      <Alert severity="info" variant="outlined">
        {labels.embeddedSignupSyncInfo}
      </Alert>
    </>
  );
}

/**
 * First-time operator guidance: Embedded Signup (FB.login) rejects origins not
 * registered in the App Dashboard, so the launch surface deep-links to the
 * "Facebook Login for Business" settings panel in a new tab with the exact
 * origin to register.
 */
function AllowedOriginsGuidance({ labels, url }: Readonly<{ labels: WhatsappLabels; url: string }>) {
  // The dialog only renders in the browser after a user click; the guard keeps
  // static rendering safe without changing what users see.
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const body = labels.embeddedSignupAllowedOriginsBody(origin);
  const originIndex = origin === "" ? -1 : body.indexOf(origin);
  const [beforeOrigin, afterOrigin] =
    originIndex === -1 ? [body, ""] : [body.slice(0, originIndex), body.slice(originIndex + origin.length)];
  return (
    <Box
      component="section"
      sx={theme => ({
        display: "flex",
        flexDirection: "column",
        gap: 1,
        p: 2,
        border: 1,
        borderColor: theme.palette.divider,
        // String radius: numeric values are multiplied by shape.borderRadius in
        // this theme's sx system, which would turn the token into a pill corner.
        borderRadius: `${theme.shape.borderRadius}px`,
      })}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <InfoOutlined fontSize="small" sx={{ color: theme => theme.palette.text.secondary }} />
        <Typography variant="labelMd" sx={{ fontWeight: 700 }}>
          {labels.embeddedSignupAllowedOriginsTitle}
        </Typography>
      </Box>
      <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, lineHeight: 1.7 }}>
        {beforeOrigin}
        {originIndex === -1 ? null : (
          <Box
            component="code"
            dir="ltr"
            sx={theme => ({
              fontFamily: "monospace",
              fontSize: "0.8125em",
              px: 0.75,
              py: 0.25,
              mx: 0.5,
              borderRadius: "4px",
              backgroundColor: theme.palette.action.hover,
              color: theme.palette.text.primary,
            })}
          >
            {origin}
          </Box>
        )}
        {afterOrigin}
      </Typography>
      <Button
        variant="outlined"
        color="inherit"
        size="small"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        endIcon={<OpenInNewOutlined fontSize="small" />}
        sx={{ alignSelf: "flex-start", gap: 0.5 }}
      >
        {labels.embeddedSignupAllowedOriginsLink}
      </Button>
    </Box>
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
  allowedOriginsUrl = null,
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
          {allowedOriginsUrl ? <AllowedOriginsGuidance labels={labels} url={allowedOriginsUrl} /> : null}
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

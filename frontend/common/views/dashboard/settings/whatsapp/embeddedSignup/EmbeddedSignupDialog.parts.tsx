"use client";

import { Box, Button, DialogActions, Step, StepLabel, Stepper, Typography } from "@mui/material";
import type { EmbeddedSignupSession } from "@/frontend/common/views/dashboard/settings/whatsapp/embeddedSignup/useEmbeddedSignupSession";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

// Step mapping: launch (0) completes once the FB flow reports a code or
// asset IDs; app pairing (1) completes when completion starts; sync (2)
// completes on mutation success.
function resolveActiveStep(session: EmbeddedSignupSession): number {
  if (session.phase === "submitting") {
    return 2;
  }
  if (session.phase === "success") {
    return 3;
  }
  if (session.codeReceived || session.assetsReceived) {
    return 1;
  }
  return 0;
}

function EmbeddedSignupStepper({
  session,
  labels,
}: Readonly<{
  readonly session: EmbeddedSignupSession;
  readonly labels: WhatsappLabels;
}>) {
  const activeStep = resolveActiveStep(session);
  const failed = session.phase === "cancelled" || session.phase === "error";

  const stepLabels = [
    labels.embeddedSignupLaunch,
    labels.embeddedSignupStepCompleteInApp,
    labels.embeddedSignupStepSync,
  ];

  return (
    <Stepper
      activeStep={activeStep}
      alternativeLabel
      sx={theme => ({
        width: "100%",
        "& .MuiStepLabel-label": {
          color: theme.palette.text.secondary,
          textWrap: "balance",
          mt: 0.5,
        },
        "& .MuiStepLabel-label.Mui-active, & .MuiStepLabel-label.Mui-completed": {
          color: theme.palette.text.primary,
          fontWeight: 600,
        },
        // Upcoming steps ship as dark-navy numerals on near-black
        // circles at the default tokens; lift both to readable levels.
        "& .MuiStepIcon-root:not(.Mui-active):not(.Mui-completed)": {
          color: theme.palette.action.selected,
          "& .MuiStepIcon-text": { fill: theme.palette.text.primary },
        },
      })}
    >
      {stepLabels.map((label, index) => (
        <Step key={label} completed={session.phase === "success" || index < activeStep}>
          <StepLabel error={failed && index === activeStep}>{label}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}

export function EmbeddedSignupNotConfigured({ labels }: Readonly<{ readonly labels: WhatsappLabels }>) {
  return (
    <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, mt: 1 }}>
      {labels.embeddedSignupNotConfigured}
    </Typography>
  );
}

export function EmbeddedSignupConfiguredContent({
  session,
  labels,
  children,
}: Readonly<{
  readonly session: EmbeddedSignupSession;
  readonly labels: WhatsappLabels;
  readonly children: React.ReactNode;
}>) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2.5, sm: 3 }, pt: 1 }}>
      <EmbeddedSignupStepper session={session} labels={labels} />
      {children}
    </Box>
  );
}

export function EmbeddedSignupActions({
  phase,
  busy,
  labels,
  onClose,
}: Readonly<{
  readonly phase: EmbeddedSignupSession["phase"];
  readonly busy: boolean;
  readonly labels: WhatsappLabels;
  readonly onClose: () => void;
}>) {
  return (
    <DialogActions sx={{ px: 3, pt: 1, pb: 2 }}>
      <Button onClick={onClose} disabled={busy} color="inherit" sx={{ color: theme => theme.palette.text.secondary }}>
        {labels.cancel}
      </Button>
      {phase === "success" ? (
        <Button variant="contained" onClick={onClose}>
          {labels.embeddedSignupDone}
        </Button>
      ) : null}
    </DialogActions>
  );
}

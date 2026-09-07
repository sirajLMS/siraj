"use client";

/**
 * Embedded Signup (coexistence) dialog shown from the Numbers tab.
 *
 * Drives Meta's ES v4 flow (FB SDK + `FB.login` with the server-resolved
 * `config_id`), listens for `WA_EMBEDDED_SIGNUP` session events, and hands
 * the captured code/asset IDs to the ViewModel's completion mutation. The
 * 3-step stepper mirrors the real session state machine in
 * `useEmbeddedSignupSession` — no timers or fabricated progress.
 */

import CloseOutlined from "@mui/icons-material/CloseOutlined";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";
import { useCallback } from "react";
import { EmbeddedSignupPhaseContent } from "@/frontend/common/views/dashboard/settings/whatsapp/embeddedSignup/EmbeddedSignupPhaseContent";
import { useEmbeddedSignupSession } from "@/frontend/common/views/dashboard/settings/whatsapp/embeddedSignup/useEmbeddedSignupSession";
import type { WhatsappEmbeddedSignupPayload } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

export interface EmbeddedSignupDialogProps {
  readonly open: boolean;
  /** Full-screen presentation (mobile tier). */
  readonly fullScreen: boolean;
  readonly labels: WhatsappLabels;
  /** Server-resolved ES configuration id (null → not configured surface). */
  readonly configId: string | null;
  /** Server-resolved Meta App ID for FB SDK init. */
  readonly appId: string | null;
  readonly onComplete: (payload: WhatsappEmbeddedSignupPayload) => Promise<void>;
  readonly onClose: () => void;
}

export function EmbeddedSignupDialog({
  open,
  fullScreen,
  labels,
  configId,
  appId,
  onComplete,
  onClose,
}: Readonly<EmbeddedSignupDialogProps>) {
  const session = useEmbeddedSignupSession({ open, appId, configId, onComplete });

  const handleClose = useCallback(() => {
    session.reset();
    onClose();
  }, [session, onClose]);

  const phase = session.phase;
  const busy = phase === "waiting" || phase === "submitting";
  const failed = phase === "cancelled" || phase === "error";
  const configured = configId !== null && appId !== null;

  // Step mapping: launch (0) completes once the FB flow reports a code or
  // asset IDs; app pairing (1) completes when completion starts; sync (2)
  // completes on mutation success.
  let activeStep = 0;
  if (phase === "submitting") {
    activeStep = 2;
  } else if (phase === "success") {
    activeStep = 3;
  } else if (session.codeReceived || session.assetsReceived) {
    activeStep = 1;
  }

  const stepLabels = [
    labels.embeddedSignupLaunch,
    labels.embeddedSignupStepCompleteInApp,
    labels.embeddedSignupStepSync,
  ];

  return (
    <Dialog open={open} onClose={handleClose} fullScreen={fullScreen} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        {labels.embeddedSignupTitle}
        <IconButton aria-label={labels.embeddedSignupClose} onClick={handleClose} disabled={busy} size="small">
          <CloseOutlined fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pb: 1 }}>
        {configured ? (
          <Box
            sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: "stretch", gap: 3, mt: 1 }}
          >
            <Stepper
              orientation="vertical"
              activeStep={activeStep}
              sx={{ minWidth: { sm: 200 }, justifyContent: { xs: "flex-start", sm: "center" } }}
            >
              {stepLabels.map((label, index) => (
                <Step key={label} completed={phase === "success" || index < activeStep}>
                  <StepLabel error={failed && index === activeStep}>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <EmbeddedSignupPhaseContent
                phase={phase}
                labels={labels}
                onLaunch={session.launch}
                onRetry={session.reset}
              />
            </Box>
          </Box>
        ) : (
          <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, mt: 1 }}>
            {labels.embeddedSignupNotConfigured}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pt: 1, pb: 2 }}>
        <Button onClick={handleClose} disabled={busy}>
          {labels.cancel}
        </Button>
        {phase === "success" ? (
          <Button variant="contained" onClick={handleClose}>
            {labels.embeddedSignupDone}
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}

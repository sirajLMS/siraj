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
import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import { useCallback } from "react";
import {
  EmbeddedSignupActions,
  EmbeddedSignupConfiguredContent,
  EmbeddedSignupNotConfigured,
} from "@/frontend/common/views/dashboard/settings/whatsapp/embeddedSignup/EmbeddedSignupDialog.parts";
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
  /** Meta App Dashboard "Facebook Login for Business" settings URL — where allowed origins are registered (null → guidance hidden). */
  readonly allowedOriginsUrl?: string | null;
  readonly onComplete: (payload: WhatsappEmbeddedSignupPayload) => Promise<void>;
  readonly onClose: () => void;
}

export function EmbeddedSignupDialog({
  open,
  fullScreen,
  labels,
  configId,
  appId,
  allowedOriginsUrl = null,
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
  const configured = configId !== null && appId !== null;

  return (
    <Dialog open={open} onClose={handleClose} fullScreen={fullScreen} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        {labels.embeddedSignupTitle}
        <IconButton aria-label={labels.embeddedSignupClose} onClick={handleClose} disabled={busy} size="small">
          <CloseOutlined fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ pb: 1 }}>
        {configured ? (
          <EmbeddedSignupConfiguredContent session={session} labels={labels}>
            <EmbeddedSignupPhaseContent
              phase={phase}
              labels={labels}
              allowedOriginsUrl={allowedOriginsUrl}
              onLaunch={session.launch}
              onRetry={session.reset}
            />
          </EmbeddedSignupConfiguredContent>
        ) : (
          <EmbeddedSignupNotConfigured labels={labels} />
        )}
      </DialogContent>
      <EmbeddedSignupActions phase={phase} busy={busy} labels={labels} onClose={handleClose} />
    </Dialog>
  );
}

"use client";

/**
 * Instruction region of the Embedded Signup dialog: renders the body copy,
 * progress/error surfaces, and guidance (version note + background-sync
 * info alert) for the active step of the ES session state machine.
 */

import { Box } from "@mui/material";
import {
  EmbeddedSignupBusyBlock,
  EmbeddedSignupFailedContent,
  EmbeddedSignupGuidance,
  EmbeddedSignupLaunchContent,
  EmbeddedSignupSuccessContent,
} from "@/frontend/common/views/dashboard/settings/whatsapp/embeddedSignup/EmbeddedSignupPhaseContent.parts";
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

export function EmbeddedSignupPhaseContent({
  phase,
  labels,
  allowedOriginsUrl = null,
  onLaunch,
  onRetry,
}: Readonly<EmbeddedSignupPhaseContentProps>) {
  if (phase === "cancelled" || phase === "error") {
    return <EmbeddedSignupFailedContent phase={phase} labels={labels} onRetry={onRetry} />;
  }
  if (phase === "submitting") {
    return (
      <EmbeddedSignupBusyBlock
        title={labels.embeddedSignupCompletingTitle}
        body={labels.embeddedSignupCompletingBody}
      />
    );
  }
  if (phase === "success") {
    return <EmbeddedSignupSuccessContent labels={labels} />;
  }
  // idle | waiting — pairing finishes inside the Meta window / Business app.
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {phase === "waiting" ? (
        <EmbeddedSignupBusyBlock title={labels.embeddedSignupWaitingTitle} body={labels.embeddedSignupWaitingBody} />
      ) : (
        <EmbeddedSignupLaunchContent labels={labels} allowedOriginsUrl={allowedOriginsUrl} onLaunch={onLaunch} />
      )}
      <EmbeddedSignupGuidance labels={labels} />
    </Box>
  );
}

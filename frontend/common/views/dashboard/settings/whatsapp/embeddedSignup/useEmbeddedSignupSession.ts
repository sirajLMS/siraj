"use client";

/**
 * State machine for the Embedded Signup dialog: drives the FB login popup,
 * tracks `WA_EMBEDDED_SIGNUP` session events, and — once both the
 * authorization code and the asset IDs are in hand — hands the payload to
 * `onComplete` (the GraphQL mutation owned by the numbers ViewModel).
 */

import { useCallback, useRef, useState } from "react";
import type {
  EmbeddedSignupPhase,
  EmbeddedSignupSessionData,
} from "@/frontend/common/views/dashboard/settings/whatsapp/embeddedSignup/embeddedSignupTypes";
import { useEmbeddedSignupCompletion } from "@/frontend/common/views/dashboard/settings/whatsapp/embeddedSignup/useEmbeddedSignupSession.completion";
import {
  useEmbeddedSignupLaunch,
  useEmbeddedSignupSessionEvents,
} from "@/frontend/common/views/dashboard/settings/whatsapp/embeddedSignup/useEmbeddedSignupSession.hooks";
import type { WhatsappEmbeddedSignupPayload } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";

export interface UseEmbeddedSignupSessionArgs {
  /** Whether the dialog is open (listener attaches only while open). */
  readonly open: boolean;
  /** Meta App ID for FB.init (server-resolved). */
  readonly appId: string | null;
  /** ES configuration id (server-resolved; never client-supplied). */
  readonly configId: string | null;
  /** Completion callback — should resolve on mutation success, reject on error. */
  readonly onComplete: (payload: WhatsappEmbeddedSignupPayload) => Promise<void>;
}

export interface EmbeddedSignupSession {
  readonly phase: EmbeddedSignupPhase;
  /** True once the FB.login response granted an authorization code. */
  readonly codeReceived: boolean;
  /** True once a FINISH session event delivered the asset IDs (waba…). */
  readonly assetsReceived: boolean;
  /** Kick off FB.login with the configured `config_id`. */
  readonly launch: () => void;
  /** Reset to the initial step (used by retry + dialog close). */
  readonly reset: () => void;
}

export function useEmbeddedSignupSession({
  open,
  appId,
  configId,
  onComplete,
}: UseEmbeddedSignupSessionArgs): EmbeddedSignupSession {
  const [phase, setPhase] = useState<EmbeddedSignupPhase>("idle");
  const [codeReceived, setCodeReceived] = useState(false);
  const [assetsReceived, setAssetsReceived] = useState(false);
  const codeRef = useRef<string | null>(null);
  const sessionRef = useRef<EmbeddedSignupSessionData | null>(null);
  const completingRef = useRef(false);

  const reset = useCallback(() => {
    codeRef.current = null;
    sessionRef.current = null;
    completingRef.current = false;
    setCodeReceived(false);
    setAssetsReceived(false);
    setPhase("idle");
  }, []);

  const { maybeComplete } = useEmbeddedSignupCompletion({
    onComplete,
    codeRef,
    sessionRef,
    completingRef,
    setPhase,
  });

  useEmbeddedSignupSessionEvents({
    open,
    sessionRef,
    setAssetsReceived,
    setPhase,
    maybeComplete,
  });

  const { launch } = useEmbeddedSignupLaunch({
    appId,
    configId,
    codeRef,
    sessionRef,
    setCodeReceived,
    setAssetsReceived,
    setPhase,
    maybeComplete,
  });

  return { phase, codeReceived, assetsReceived, launch, reset };
}

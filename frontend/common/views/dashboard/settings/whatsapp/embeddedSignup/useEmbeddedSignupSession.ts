"use client";

/**
 * State machine for the Embedded Signup dialog: drives the FB login popup,
 * tracks `WA_EMBEDDED_SIGNUP` session events, and — once both the
 * authorization code and the asset IDs are in hand — hands the payload to
 * `onComplete` (the GraphQL mutation owned by the numbers ViewModel).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { logger } from "@/frontend/common/utils/logger";
import {
  ensureFbSdk,
  launchEmbeddedSignup,
  parseEmbeddedSignupMessage,
} from "@/frontend/common/views/dashboard/settings/whatsapp/embeddedSignup/embeddedSignupSdk";
import type {
  EmbeddedSignupPhase,
  EmbeddedSignupSessionData,
  FbLoginResponse,
} from "@/frontend/common/views/dashboard/settings/whatsapp/embeddedSignup/embeddedSignupTypes";
import type { WhatsappEmbeddedSignupPayload } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";

const FINISH_EVENTS: ReadonlySet<string> = new Set([
  "FINISH",
  "FINISH_ONLY_WABA",
  "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING",
]);

/**
 * Meta posts `WA_EMBEDDED_SIGNUP` session events from the facebook.com origin
 * inside the login popup; messages from any other origin are ignored.
 */
const EMBEDDED_SIGNUP_MESSAGE_ORIGIN = "https://www.facebook.com";

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
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const reset = useCallback(() => {
    codeRef.current = null;
    sessionRef.current = null;
    completingRef.current = false;
    setCodeReceived(false);
    setAssetsReceived(false);
    setPhase("idle");
  }, []);

  const maybeComplete = useCallback(async () => {
    const code = codeRef.current;
    const session = sessionRef.current;
    if (!code || !session?.waba_id || completingRef.current) {
      return;
    }
    completingRef.current = true;
    setPhase("submitting");
    try {
      await onCompleteRef.current({
        code,
        wabaId: session.waba_id,
        phoneNumberId: session.phone_number_id,
        businessId: session.business_id,
      });
      setPhase("success");
    } catch (error) {
      logger.error("whatsapp embedded signup completion failed", { error });
      setPhase("error");
    } finally {
      completingRef.current = false;
    }
  }, []);

  // Session-logging listener — active only while the dialog is open.
  useEffect(() => {
    if (!open) return undefined;
    const handler = (event: MessageEvent) => {
      if (event.origin !== EMBEDDED_SIGNUP_MESSAGE_ORIGIN) return;
      const sessionEvent = parseEmbeddedSignupMessage(event.data);
      if (!sessionEvent) return;
      if (FINISH_EVENTS.has(sessionEvent.event)) {
        sessionRef.current = sessionEvent.data ?? {};
        setAssetsReceived(true);
        void maybeComplete();
      } else if (sessionEvent.event === "CANCEL") {
        setPhase("cancelled");
      } else if (sessionEvent.event === "ERROR") {
        logger.error("whatsapp embedded signup session error", { step: sessionEvent.current_step });
        setPhase("error");
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [open, maybeComplete]);

  const handleLoginResponse = useCallback(
    (response: FbLoginResponse) => {
      const code = response.authResponse?.code;
      if (code) {
        codeRef.current = code;
        setCodeReceived(true);
        void maybeComplete();
      } else {
        // Popup closed without granting — treat as cancellation unless a
        // CANCEL session event already landed.
        setPhase(current => (current === "waiting" ? "cancelled" : current));
      }
    },
    [maybeComplete]
  );

  const launch = useCallback(() => {
    const resolvedAppId = appId;
    const resolvedConfigId = configId;
    if (!resolvedAppId || !resolvedConfigId) return;
    codeRef.current = null;
    sessionRef.current = null;
    setCodeReceived(false);
    setAssetsReceived(false);
    setPhase("waiting");

    const run = async () => {
      try {
        const fb = await ensureFbSdk(resolvedAppId);
        launchEmbeddedSignup(fb, resolvedConfigId, handleLoginResponse);
      } catch (error) {
        logger.error("whatsapp embedded signup SDK load failed", { error });
        setPhase("error");
      }
    };
    void run();
  }, [appId, configId, handleLoginResponse]);

  return { phase, codeReceived, assetsReceived, launch, reset };
}

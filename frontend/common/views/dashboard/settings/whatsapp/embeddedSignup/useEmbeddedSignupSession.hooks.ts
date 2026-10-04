"use client";

import { type Dispatch, type RefObject, type SetStateAction, useCallback, useEffect } from "react";
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

type SetPhase = Dispatch<SetStateAction<EmbeddedSignupPhase>>;

/**
 * Meta posts `WA_EMBEDDED_SIGNUP` session events from the facebook.com origin
 * inside the login popup; messages from any other origin are ignored.
 */
const EMBEDDED_SIGNUP_MESSAGE_ORIGIN = "https://www.facebook.com";

const FINISH_EVENTS: ReadonlySet<string> = new Set([
  "FINISH",
  "FINISH_ONLY_WABA",
  "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING",
]);

/**
 * Session-logging listener — active only while the dialog is open. Records the
 * asset IDs from FINISH events and maps CANCEL/ERROR events to their phases.
 */
export function useEmbeddedSignupSessionEvents({
  open,
  sessionRef,
  setAssetsReceived,
  setPhase,
  maybeComplete,
}: {
  readonly open: boolean;
  readonly sessionRef: RefObject<EmbeddedSignupSessionData | null>;
  readonly setAssetsReceived: Dispatch<SetStateAction<boolean>>;
  readonly setPhase: SetPhase;
  readonly maybeComplete: () => Promise<void>;
}) {
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
  }, [open, maybeComplete, sessionRef, setAssetsReceived, setPhase]);
}

/**
 * Kicks off FB.login with the configured `config_id`, interpreting the login
 * response (granted code vs popup dismissed) and SDK load failures.
 */
export function useEmbeddedSignupLaunch({
  appId,
  configId,
  codeRef,
  sessionRef,
  setCodeReceived,
  setAssetsReceived,
  setPhase,
  maybeComplete,
}: {
  readonly appId: string | null;
  readonly configId: string | null;
  readonly codeRef: RefObject<string | null>;
  readonly sessionRef: RefObject<EmbeddedSignupSessionData | null>;
  readonly setCodeReceived: Dispatch<SetStateAction<boolean>>;
  readonly setAssetsReceived: Dispatch<SetStateAction<boolean>>;
  readonly setPhase: SetPhase;
  readonly maybeComplete: () => Promise<void>;
}) {
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
    [codeRef, maybeComplete, setCodeReceived, setPhase]
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
  }, [appId, configId, codeRef, sessionRef, setAssetsReceived, setCodeReceived, setPhase, handleLoginResponse]);

  return { launch };
}

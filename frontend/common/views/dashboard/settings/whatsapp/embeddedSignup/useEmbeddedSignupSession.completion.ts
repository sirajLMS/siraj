"use client";

import { type Dispatch, type RefObject, type SetStateAction, useCallback, useEffect, useRef } from "react";
import { logger } from "@/frontend/common/utils/logger";
import type {
  EmbeddedSignupPhase,
  EmbeddedSignupSessionData,
} from "@/frontend/common/views/dashboard/settings/whatsapp/embeddedSignup/embeddedSignupTypes";
import type { WhatsappEmbeddedSignupPayload } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";

/**
 * Hands the captured authorization code + asset IDs to `onComplete` exactly
 * once per attempt, keeping the latest callback in a ref so the completion
 * logic never needs to re-derive its dependencies.
 */
export function useEmbeddedSignupCompletion({
  onComplete,
  codeRef,
  sessionRef,
  completingRef,
  setPhase,
}: {
  readonly onComplete: (payload: WhatsappEmbeddedSignupPayload) => Promise<void>;
  readonly codeRef: RefObject<string | null>;
  readonly sessionRef: RefObject<EmbeddedSignupSessionData | null>;
  readonly completingRef: RefObject<boolean>;
  readonly setPhase: Dispatch<SetStateAction<EmbeddedSignupPhase>>;
}) {
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

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
  }, [codeRef, completingRef, sessionRef, setPhase]);

  return { maybeComplete };
}

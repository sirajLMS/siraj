"use client";

/**
 * FB SDK loading + `WA_EMBEDDED_SIGNUP` session-event parsing for the
 * coexistence onboarding dialog. Kept framework-free so component tests can
 * drive the logic with emitted message events and a stubbed `window.FB`.
 */

import type {
  EmbeddedSignupSessionData,
  EmbeddedSignupSessionEvent,
  FbLoginResponse,
  FbSdkApi,
} from "@/frontend/common/views/dashboard/settings/whatsapp/embeddedSignup/embeddedSignupTypes";

/** Graph version passed to FB.init — the SDK init version, not our API version. */
export const FB_SDK_GRAPH_VERSION = "v25.0";

/** DOM id used for the injected SDK script (loaded at most once per page). */
const FB_SDK_SCRIPT_ID = "facebook-jssdk";

function sdkLocale(): string {
  return document.documentElement.lang === "ar" ? "ar_AR" : "en_US";
}

/**
 * Ensures the FB SDK script is present and initialized. Idempotent — a
 * pre-existing script or `window.FB` instance is reused (the tests stub
 * `window.FB` directly, in which case no network is touched).
 */
export async function ensureFbSdk(appId: string): Promise<FbSdkApi> {
  if (window.FB) {
    window.FB.init({ appId, cookie: false, xfbml: false, version: FB_SDK_GRAPH_VERSION });
    return window.FB;
  }

  await new Promise<void>((resolve, reject) => {
    if (document.getElementById(FB_SDK_SCRIPT_ID)) {
      resolve();
      return;
    }
    window.fbAsyncInit = () => {
      window.FB?.init({ appId, cookie: false, xfbml: false, version: FB_SDK_GRAPH_VERSION });
      resolve();
    };
    const script = document.createElement("script");
    script.id = FB_SDK_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    // The app CSP keys script-src on a per-request nonce ('unsafe-inline' is
    // ignored once a nonce is present), so a dynamically injected script must
    // carry the same nonce or the browser blocks the FB SDK load.
    const nonceSource = document.querySelector<HTMLScriptElement>("script[nonce]");
    if (nonceSource?.nonce) {
      script.nonce = nonceSource.nonce;
    }
    script.src = `https://connect.facebook.net/${sdkLocale()}/sdk.js`;
    script.addEventListener("error", () => reject(new Error("FB SDK load failed")), { once: true });
    document.body.appendChild(script);
  });

  if (!window.FB) {
    throw new Error("FB SDK unavailable after load");
  }
  return window.FB;
}

/**
 * Meta rejects `FB.login` on pages served over plain HTTP (the SDK throws a
 * console error before the popup opens). Server renders and tests without a
 * `window` report "supported" — the caller resolves the real value after mount.
 */
export function isEmbeddedSignupSupported(): boolean {
  return typeof window === "undefined" || window.location.protocol === "https:";
}

/**
 * Launches the Embedded Signup login flow for the given `config_id`
 * (`whatsapp_business_app_onboarding` feature, authorization-code response).
 * Returns the `FB.login` response — the ES session events for asset IDs
 * arrive separately via `window` message events.
 */
export function launchEmbeddedSignup(
  fb: FbSdkApi,
  configId: string,
  callback: (response: FbLoginResponse) => void
): void {
  fb.login(callback, {
    config_id: configId,
    response_type: "code",
    override_default_response_type: true,
    extras: {
      setup: {},
      featureType: "whatsapp_business_app_onboarding",
    },
  });
}

/**
 * Type guard for the asset snapshot carried by FINISH events — each known
 * field must be a string when present.
 */
function isSessionData(value: unknown): value is EmbeddedSignupSessionData {
  if (typeof value !== "object" || value === null) return false;
  return ["phone_number_id", "waba_id", "business_id"].every(key => {
    const field: unknown = Reflect.get(value, key);
    return field === undefined || typeof field === "string";
  });
}

/**
 * Parses a raw `window` message payload into an ES session event, returning
 * null for foreign messages. Accepts the payload both as an object and as a
 * JSON string (Meta posts it as a string on some browsers).
 */
export function parseEmbeddedSignupMessage(raw: unknown): EmbeddedSignupSessionEvent | null {
  let candidate: unknown = raw;
  if (typeof raw === "string") {
    try {
      candidate = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (typeof candidate !== "object" || candidate === null) {
    return null;
  }
  const typeValue: unknown = Reflect.get(candidate, "type");
  const eventValue: unknown = Reflect.get(candidate, "event");
  if (typeValue !== "WA_EMBEDDED_SIGNUP" || typeof eventValue !== "string") {
    return null;
  }
  const dataValue: unknown = Reflect.get(candidate, "data");
  const currentStep: unknown = Reflect.get(candidate, "current_step");
  const errorMessage: unknown = Reflect.get(candidate, "error_message");
  return {
    type: "WA_EMBEDDED_SIGNUP",
    event: eventValue,
    ...(isSessionData(dataValue) ? { data: dataValue } : {}),
    ...(typeof currentStep === "string" ? { current_step: currentStep } : {}),
    ...(typeof errorMessage === "string" ? { error_message: errorMessage } : {}),
  };
}

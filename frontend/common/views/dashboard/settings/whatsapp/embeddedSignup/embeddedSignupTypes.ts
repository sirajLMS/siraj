/**
 * Types for the WhatsApp Embedded Signup (ES v4) coexistence dialog flow.
 *
 * The FB SDK is loaded lazily and driven through the minimal ambient surface
 * declared here — we never depend on the full Meta typings package.
 */

/** Phases of the embedded-signup dialog state machine. */
export type EmbeddedSignupPhase = "idle" | "waiting" | "submitting" | "success" | "cancelled" | "error";

/** `authResponse` slice returned by the FB.login callback when a code is granted. */
interface FbLoginAuthResponse {
  readonly code?: string;
}

/** FB.login callback response. */
export interface FbLoginResponse {
  readonly authResponse?: FbLoginAuthResponse | null;
  readonly status?: string;
}

/** Minimal FB SDK surface this flow uses. */
export interface FbSdkApi {
  init(options: { appId: string; cookie?: boolean; xfbml?: boolean; version: string }): void;
  login(callback: (response: FbLoginResponse) => void, options?: Record<string, unknown>): void;
}

declare global {
  interface Window {
    FB?: FbSdkApi;
    fbAsyncInit?: () => void;
  }
}

/**
 * Asset snapshot carried by `WA_EMBEDDED_SIGNUP` session-logging events
 * (`FINISH*`). `phone_number_id` may be absent (only-`waba_id` finish).
 */
export interface EmbeddedSignupSessionData {
  readonly phone_number_id?: string;
  readonly waba_id?: string;
  readonly business_id?: string;
}

/** Parsed `WA_EMBEDDED_SIGNUP` message payload. */
export interface EmbeddedSignupSessionEvent {
  readonly type: "WA_EMBEDDED_SIGNUP";
  /**
   * Session event name: FINISH / FINISH_ONLY_WABA /
   * FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING complete the flow; CANCEL and
   * ERROR surface their own states. Kept as `string` — Meta may add events.
   */
  readonly event: string;
  readonly data?: EmbeddedSignupSessionData;
  readonly current_step?: string;
  readonly error_message?: string;
}

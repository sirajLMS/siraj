"use client";

import type { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback } from "react";
import { logger } from "@/frontend/common/utils/logger";
import type { OAuthCallbackStatus } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/OAuthCallbackHandler";
import type { MeetingConfigEnhancementLabels } from "@/shared/locale/types/ui";

type NotificationsApi = ReturnType<typeof useNotifications>;

type CallbackLabels = Pick<
  MeetingConfigEnhancementLabels,
  "oauthCallbackSuccess" | "oauthCallbackError" | "urlCopied" | "urlCopyFailed"
>;

interface CallbackArgs {
  readonly connectedProvidersQueryRefetch: () => Promise<unknown>;
  readonly notifications: NotificationsApi;
  readonly enhancements: CallbackLabels;
}

/** Owns the OAuth callback side effects (refetch + toast) and the
 *  copy-meeting-URL clipboard action with its toasts. */
export function useMeetingConfigsManagerCallback({
  connectedProvidersQueryRefetch,
  notifications,
  enhancements,
}: CallbackArgs) {
  /** Invoked by the OAuth callback handler when the URL hash/query contains
   *  `oauth_callback` parameters. On success, refetches the connected
   *  providers list and shows a toast; on error, shows an error toast and logs
   *  the failure. The "focus" status is a no-op (focus-redirect only). */
  const handleOAuthCallback = useCallback(
    (status: OAuthCallbackStatus, provider: string, callbackError?: string) => {
      if (status === "focus") return;
      if (status === "success") {
        void connectedProvidersQueryRefetch();
        if (notifications) {
          notifications.show(enhancements.oauthCallbackSuccess, { severity: "success" });
        }
        return;
      }
      logger.error("OAuth callback error", { provider, error: callbackError });
      const message = callbackError?.trim() ?? enhancements.oauthCallbackError;
      if (notifications) {
        notifications.show(message, { severity: "error" });
      }
    },
    [connectedProvidersQueryRefetch, notifications, enhancements]
  );

  /** Copies the given meeting URL to the clipboard and shows a toast. Falls
   *  back to a hidden-textarea `document.execCommand("copy")` when
   *  `navigator.clipboard` is unavailable (insecure context, older browsers). */
  const copyUrl = useCallback(
    async (url: string) => {
      try {
        if (globalThis.navigator?.clipboard) {
          await globalThis.navigator.clipboard.writeText(url);
        } else if (globalThis.document) {
          const textarea = globalThis.document.createElement("textarea");
          textarea.value = url;
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          globalThis.document.body.append(textarea);
          textarea.select();
          const execCopy: (commandId: string) => boolean = globalThis.document.execCommand.bind(globalThis.document);
          execCopy("copy");
          textarea.remove();
        }
        if (notifications) {
          notifications.show(enhancements.urlCopied, { severity: "success" });
        }
      } catch (caughtError) {
        logger.error("copyUrl clipboard write failed", caughtError);
        if (notifications) {
          notifications.show(enhancements.urlCopyFailed, { severity: "error" });
        }
      }
    },
    [notifications, enhancements]
  );

  return { view: { handleOAuthCallback, copyUrl } };
}

"use client";

import { Box } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { logger } from "@/frontend/common/utils/logger";
import { srOnlySx } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/useCopyFeedback";
import type { MeetingConfigEnhancementLabels } from "@/shared/locale/types/ui";

/** Status emitted by the OAuth callback redirect URL params. */
export type OAuthCallbackStatus = "success" | "error" | "focus";

export type OAuthCallbackHandlerLabels = Pick<
  MeetingConfigEnhancementLabels,
  "oauthCallbackSuccess" | "oauthCallbackError"
>;

export interface OAuthCallbackHandlerProps {
  /** Translated labels passed down from the manager ViewModel (Rule 7). */
  readonly labels: OAuthCallbackHandlerLabels;
  /**
   * Called when an OAuth callback is detected via URL params or window focus.
   * The ViewModel owns the Apollo refetch and toast notifications
   * (`useNotifications`); this component never dispatches toasts directly.
   */
  readonly onCallbackDetected: (status: OAuthCallbackStatus, provider: string, error?: string) => void;
}

/** URL search params keys emitted by the OAuth callback redirect. */
const OAUTH_STATUS_PARAM = "oauth_status";
const OAUTH_PROVIDER_PARAM = "provider";
const OAUTH_ERROR_PARAM = "error";

/** Removes OAuth callback params from the URL without triggering a navigation. */
function cleanOAuthParams(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  params.delete(OAUTH_STATUS_PARAM);
  params.delete(OAUTH_PROVIDER_PARAM);
  params.delete(OAUTH_ERROR_PARAM);
  const query = params.toString();
  const cleanUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  window.history.replaceState({}, "", cleanUrl);
}

/** Reads and normalises OAuth callback params from the current URL. */
function readOAuthParams(): { status: string | null; provider: string | null; error: string | null } {
  if (typeof window === "undefined") return { status: null, provider: null, error: null };
  const params = new URLSearchParams(window.location.search);
  return {
    status: params.get(OAUTH_STATUS_PARAM),
    provider: params.get(OAUTH_PROVIDER_PARAM),
    error: params.get(OAUTH_ERROR_PARAM),
  };
}

/** Polite live region style — visually hidden but announced by screen readers. */
const liveRegionSx = srOnlySx;

export function OAuthCallbackHandler({ labels, onCallbackDetected }: Readonly<OAuthCallbackHandlerProps>) {
  const [announcement, setAnnouncement] = useState("");

  const announce = useCallback((message: string) => {
    setAnnouncement(message);
  }, []);

  useEffect(() => {
    const { status, provider, error } = readOAuthParams();

    if (status && provider) {
      if (status === "success") {
        onCallbackDetected("success", provider, error ?? undefined);
        announce(labels.oauthCallbackSuccess);
      } else if (status === "error") {
        onCallbackDetected("error", provider, error ?? undefined);
        announce(labels.oauthCallbackError);
        logger.error("OAuth callback error", { provider, error });
      }
      cleanOAuthParams();
    }

    const handleFocus = () => {
      onCallbackDetected("focus", "");
    };
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [labels, onCallbackDetected, announce]);

  return (
    <Box component="output" aria-live="polite" sx={liveRegionSx}>
      {announcement}
    </Box>
  );
}

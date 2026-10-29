"use client";

import type { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback, useRef, useState } from "react";
import { safeOpenWindow } from "@/frontend/common/lib/safeOpenWindow";
import type { ReconnectAllProgress } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigsManager.helpers";
import type { MeetingConfigEnhancementLabels } from "@/shared/locale/types/ui";

type NotificationsApi = ReturnType<typeof useNotifications>;

type ToastEnhancementLabels = Pick<
  MeetingConfigEnhancementLabels,
  "reconnectedProviders" | "reconnectFailedProviders" | "urlCopied" | "urlCopyFailed"
>;

/** Shows a toast notification summarising a reconnect-all batch outcome. */
function showReconnectBatchToast(
  notifications: NotificationsApi | null,
  enhancements: ToastEnhancementLabels,
  reconnectedCount: number,
  failedCount: number
): void {
  if (!notifications) {
    return;
  }
  if (reconnectedCount > 0 && failedCount === 0) {
    notifications.show(enhancements.reconnectedProviders(reconnectedCount), {
      severity: "success",
    });
  } else if (failedCount > 0 && reconnectedCount === 0) {
    notifications.show(enhancements.reconnectFailedProviders(failedCount), {
      severity: "error",
    });
  } else if (reconnectedCount > 0 && failedCount > 0) {
    notifications.show(
      `${enhancements.reconnectedProviders(reconnectedCount)} — ${enhancements.reconnectFailedProviders(failedCount)}`,
      { severity: "warning" }
    );
  }
}

interface ReconnectAllArgs {
  readonly requestOAuthAuthorizeUrl: (providerSlug: string) => Promise<string | null>;
  readonly notifications: NotificationsApi;
  readonly enhancements: ToastEnhancementLabels;
}

/** Owns the "Reconnect All" batch flow: collects authorize URLs per provider
 *  (without redirecting, so the batch can finish), tracks progress state, and
 *  on completion shows a summary toast and opens the collected OAuth URLs in
 *  separate tabs for the user to complete the flows sequentially. */
export function useMeetingConfigsManagerReconnectAll({
  requestOAuthAuthorizeUrl,
  notifications,
  enhancements,
}: ReconnectAllArgs) {
  const [reconnectAllProgress, setReconnectAllProgress] = useState<ReconnectAllProgress | null>(null);
  const reconnectUrlsRef = useRef<Map<string, string>>(new Map());

  /** Boolean-returning reconnect wrapper for the batch flow: reports
   *  success/failure via the return value instead of redirecting the page. */
  const reconnectAllProvider = useCallback(
    async (providerSlug: string): Promise<boolean> => {
      const authorizeUrl = await requestOAuthAuthorizeUrl(providerSlug);
      if (authorizeUrl) {
        reconnectUrlsRef.current.set(providerSlug, authorizeUrl);
        return true;
      }
      return false;
    },
    [requestOAuthAuthorizeUrl]
  );

  const onReconnectAllComplete = useCallback(
    (reconnectedCount: number, failedCount: number) => {
      showReconnectBatchToast(notifications, enhancements, reconnectedCount, failedCount);
      const urls = reconnectUrlsRef.current;
      if (urls.size > 0) {
        for (const url of urls.values()) {
          safeOpenWindow(url);
        }
        urls.clear();
      }
    },
    [notifications, enhancements]
  );

  /** Sequentially reconnects each provider one at a time. Progress is tracked
   *  via {@link reconnectAllProgress} and completion via
   *  {@link onReconnectAllComplete}. Uses a recursive helper because the batch
   *  is sequential by design. */
  const reconnectAll = useCallback(
    async (providerSlugs: readonly string[]) => {
      if (providerSlugs.length === 0) return;
      const total = providerSlugs.length;
      setReconnectAllProgress({
        current: 1,
        total,
        providerSlug: providerSlugs[0] ?? "",
      });
      const processNext = async (index: number, successCount: number, failureCount: number): Promise<void> => {
        if (index >= total) {
          setReconnectAllProgress(null);
          onReconnectAllComplete(successCount, failureCount);
          return;
        }
        const slug = providerSlugs[index];
        if (!slug) {
          return processNext(index + 1, successCount, failureCount);
        }
        setReconnectAllProgress({ current: index + 1, total, providerSlug: slug });
        const succeeded = await reconnectAllProvider(slug);
        return processNext(
          index + 1,
          succeeded ? successCount + 1 : successCount,
          succeeded ? failureCount : failureCount + 1
        );
      };
      await processNext(0, 0, 0);
    },
    [reconnectAllProvider, onReconnectAllComplete]
  );

  return {
    view: { reconnectAllProvider, onReconnectAllComplete, reconnectAll, reconnectAllProgress },
  };
}

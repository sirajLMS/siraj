"use client";

import { useApolloClient, useQuery } from "@apollo/client/react";
import { useEffect, useRef } from "react";
import { meQueryDocument, userQueryDocument } from "@/frontend/common/graphql/sharedDocuments/auth/auth.documents";
import { fxSyncHealthQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing/fx-ingestion.documents";
import { profileByUserIdQueryDocument } from "@/frontend/common/graphql/sharedDocuments/profile/profile.documents";
import { FX_SUBJECT_CURRENCY_CHANGED_KEY } from "@/frontend/common/lib/sync-subject-profile";
import { syncViewerFromProfile } from "@/frontend/common/lib/sync-viewer-profile";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";

const VISIBILITY_FETCH_DEBOUNCE_MS = 30_000;

function onFetchFailed(error: unknown) {
  logger.warn("FX live refresh visibilitychange fetch failed", {
    error: error instanceof Error ? error.message : String(error),
  });
}

function onRefetchFailed(error: unknown) {
  logger.warn("FX live refresh refetch failed", {
    error: error instanceof Error ? error.message : String(error),
  });
}

function onMeFetched(
  client: ReturnType<typeof useApolloClient>,
  refetchFxHealth: () => Promise<{ data: unknown; error?: Error }>,
  syncViewerFn: typeof import("@/frontend/common/lib/sync-viewer-profile").syncViewerFromProfile,
  result: Awaited<ReturnType<typeof client.query>>
) {
  const me = result.data?.me;
  if (!me) {
    return;
  }

  // Only sync if displayCurrency is explicitly set (not null/undefined)
  if (me.displayCurrency !== null && me.displayCurrency !== undefined) {
    syncViewerFn(client, { displayCurrency: me.displayCurrency });
    if (me.displayCurrency) {
      refetchFxHealth().catch(onRefetchFailed);
    }
  }
}

export function useFxLiveRefresh(): void {
  const client = useApolloClient();
  const displayCurrency = useUserStore(state => state.displayCurrency);
  const { refetch: refetchFxHealth } = useQuery(fxSyncHealthQueryDocument, {
    skip: !displayCurrency,
    fetchPolicy: "cache-first",
  });

  const lastFetchRef = useRef<number>(0);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      const now = Date.now();
      if (now - lastFetchRef.current < VISIBILITY_FETCH_DEBOUNCE_MS) {
        return;
      }
      lastFetchRef.current = now;

      client
        .query({ query: meQueryDocument, fetchPolicy: "network-only" })
        .then(result => onMeFetched(client, refetchFxHealth, syncViewerFromProfile, result))
        .catch(onFetchFailed);
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== FX_SUBJECT_CURRENCY_CHANGED_KEY || !event.newValue) {
        return;
      }

      try {
        const payload = JSON.parse(event.newValue);
        if (!payload || typeof payload.userId !== "string" || typeof payload.ts !== "number") {
          return;
        }
      } catch {
        return;
      }

      client
        .refetchQueries({
          include: [profileByUserIdQueryDocument, userQueryDocument, meQueryDocument],
        })
        .catch(error => {
          logger.warn("FX live refresh refetchQueries failed", { error: error.message });
        });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    globalThis.addEventListener("storage", handleStorageChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      globalThis.removeEventListener("storage", handleStorageChange);
    };
  }, [client, refetchFxHealth]);
}

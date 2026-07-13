"use client";

import { useApolloClient, useQuery } from "@apollo/client/react";
import { useEffect, useRef } from "react";
import { meQueryDocument, userQueryDocument } from "@/frontend/common/graphql/sharedDocuments/auth/auth.documents";
import { fxSyncHealthQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing/fx-sync-health.documents";
import { profileByUserIdQueryDocument } from "@/frontend/common/graphql/sharedDocuments/profile/profile.documents";
import { FX_SUBJECT_CURRENCY_CHANGED_KEY } from "@/frontend/common/lib/sync-subject-profile";
import { syncViewerFromProfile } from "@/frontend/common/lib/sync-viewer-profile";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";

const VISIBILITY_FETCH_DEBOUNCE_MS = 30_000;

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

      void client
        .query({ query: meQueryDocument, fetchPolicy: "network-only" })
        .then(result => {
          const me = result.data?.me;
          if (!me) {
            return;
          }

          // Only sync if displayCurrency is explicitly set (not null/undefined)
          if (me.displayCurrency !== null && me.displayCurrency !== undefined) {
            syncViewerFromProfile(client, { displayCurrency: me.displayCurrency });
            if (me.displayCurrency) {
              void refetchFxHealth();
            }
          }
        })
        .catch(error => {
          logger.warn("FX live refresh visibilitychange fetch failed", { error: error.message });
        });
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

      void client.refetchQueries({
        include: [profileByUserIdQueryDocument, userQueryDocument, meQueryDocument],
      });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [client, refetchFxHealth]);
}

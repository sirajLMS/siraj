"use client";

import { useApolloClient, useQuery } from "@apollo/client/react";
import { useEffect } from "react";
import { meQueryDocument, userQueryDocument } from "@/frontend/graphql/sharedDocuments/auth/auth.documents";
import { fxSyncHealthQueryDocument } from "@/frontend/graphql/sharedDocuments/billing/fx-sync-health.documents";
import { profileByUserIdQueryDocument } from "@/frontend/graphql/sharedDocuments/profile/profile.documents";
import { FX_SUBJECT_CURRENCY_CHANGED_KEY } from "@/frontend/lib/sync-subject-profile";
import { syncViewerFromProfile } from "@/frontend/lib/sync-viewer-profile";
import { useUserStore } from "@/frontend/stores/userStore";

export function useFxLiveRefresh(): void {
  const client = useApolloClient();
  const displayCurrency = useUserStore(state => state.displayCurrency);
  const { refetch: refetchFxHealth } = useQuery(fxSyncHealthQueryDocument, {
    skip: !displayCurrency,
    fetchPolicy: "cache-first",
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      void client.query({ query: meQueryDocument, fetchPolicy: "network-only" }).then(result => {
        const me = result.data?.me;
        if (!me) {
          return;
        }

        syncViewerFromProfile(client, { displayCurrency: me.displayCurrency });
        if (me.displayCurrency) {
          void refetchFxHealth();
        }
      });
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== FX_SUBJECT_CURRENCY_CHANGED_KEY || !event.newValue) {
        return;
      }

      void client.refetchQueries({
        include: [profileByUserIdQueryDocument, userQueryDocument],
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

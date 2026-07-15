import type { ApolloClient } from "@apollo/client";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { meQueryDocument } from "@/frontend/common/graphql/sharedDocuments/auth/auth.documents";
import { fxSyncHealthQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing/fx-sync-health.documents";
import { broadcastSubjectCurrencyChanged } from "@/frontend/common/lib/sync-subject-profile";
import { useUserStore } from "@/frontend/common/stores/userStore";

export function syncViewerFromProfile(
  client: ApolloClient,
  profile: { readonly displayCurrency?: CurrencyCode | null }
): void {
  const currentUser = useUserStore.getState().user;
  if (!currentUser) {
    return;
  }

  const displayCurrency = profile.displayCurrency ?? null;
  useUserStore.getState().setUser({
    ...currentUser,
    displayCurrency,
  });

  const existingMe = client.readQuery({ query: meQueryDocument });
  if (existingMe?.me) {
    client.writeQuery({
      query: meQueryDocument,
      data: {
        me: {
          ...existingMe.me,
          displayCurrency,
        },
      },
    });
  }

  broadcastSubjectCurrencyChanged(currentUser.id ?? "");

  // Same-tab refetch for reactive consumers (e.g., FxStaleBanner, DisplayCurrencyHint)
  client
    .refetchQueries({
      include: [meQueryDocument, fxSyncHealthQueryDocument],
    })
    .catch(() => {
      // refetch failures are non-fatal for cache sync
    });
}

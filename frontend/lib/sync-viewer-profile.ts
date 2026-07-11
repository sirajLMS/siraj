import type { ApolloClient } from "@apollo/client";
import type { CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import { meQueryDocument } from "@/frontend/graphql/sharedDocuments/auth/auth.documents";
import { broadcastSubjectCurrencyChanged } from "@/frontend/lib/sync-subject-profile";
import { useUserStore } from "@/frontend/stores/userStore";

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
}

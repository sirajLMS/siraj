import type { ApolloClient } from "@apollo/client";
import type { CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import { userQueryDocument } from "@/frontend/graphql/sharedDocuments/auth/auth.documents";
import { profileByUserIdQueryDocument } from "@/frontend/graphql/sharedDocuments/profile/profile.documents";

export const FX_SUBJECT_CURRENCY_CHANGED_KEY = "fxSubjectCurrencyChanged";

export function syncSubjectProfileCache(
  client: ApolloClient,
  userId: string,
  profile: { readonly displayCurrency?: CurrencyCode | null }
): void {
  const displayCurrency = profile.displayCurrency ?? null;

  const existingUser = client.readQuery({
    query: userQueryDocument,
    variables: { id: userId },
  });
  if (existingUser?.user) {
    client.writeQuery({
      query: userQueryDocument,
      variables: { id: userId },
      data: {
        user: {
          ...existingUser.user,
          displayCurrency,
        },
      },
    });
  }

  const existingProfile = client.readQuery({
    query: profileByUserIdQueryDocument,
    variables: { userId },
  });
  if (existingProfile?.profileByUserId) {
    client.writeQuery({
      query: profileByUserIdQueryDocument,
      variables: { userId },
      data: {
        profileByUserId: {
          ...existingProfile.profileByUserId,
          displayCurrency,
        },
      },
    });
  }

  try {
    localStorage.setItem(FX_SUBJECT_CURRENCY_CHANGED_KEY, JSON.stringify({ userId, ts: Date.now() }));
  } catch {
    // localStorage may be unavailable in private browsing
  }
}

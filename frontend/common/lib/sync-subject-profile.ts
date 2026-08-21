import type { ApolloClient } from "@apollo/client";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { meQueryDocument, userQueryDocument } from "@/frontend/common/graphql/sharedDocuments/auth/auth.documents";
import { profileByUserIdQueryDocument } from "@/frontend/common/graphql/sharedDocuments/profile/profile.documents";
import { useUserStore } from "@/frontend/common/stores/userStore";

export const FX_SUBJECT_CURRENCY_CHANGED_KEY = "fxSubjectCurrencyChanged";

/**
 * Broadcast a subject display-currency change to other tabs via localStorage.
 * The `storage` event fires only in *other* windows of the same origin,
 * so callers should also refetch queries in the current tab if needed.
 */
export function broadcastSubjectCurrencyChanged(userId: string): void {
  try {
    localStorage.setItem(FX_SUBJECT_CURRENCY_CHANGED_KEY, JSON.stringify({ userId, ts: Date.now() }));
  } catch {
    // localStorage may be unavailable in private browsing
  }
}

/**
 * Synchronize the Apollo cache for a subject profile + user, broadcast
 * the change to other tabs, AND refetch relevant queries in the current
 * tab so same-tab reactive consumers stay fresh.
 */
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

  broadcastSubjectCurrencyChanged(userId);

  client
    .refetchQueries({
      include: [profileByUserIdQueryDocument, userQueryDocument, meQueryDocument],
    })
    .catch(() => {
      // refetch failures are non-fatal for cache sync
    });
}

/**
 * Synchronize the viewer's own display currency across tabs.
 * Use after any mutation that changes the viewer's `me.displayCurrency`
 * outside the standard `syncViewerFromProfile` path.
 */
export function syncViewerDisplayCurrencyAcrossTabs(): void {
  try {
    localStorage.setItem(
      FX_SUBJECT_CURRENCY_CHANGED_KEY,
      JSON.stringify({ userId: useUserStore.getState().user?.id ?? "viewer", ts: Date.now() })
    );
  } catch {
    // localStorage may be unavailable
  }
}

"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  MeetingProvidersQuery,
  MyConnectedMeetingProvidersQuery,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { ConnectionState } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ConnectProviderAccount";
import type { ExpiryState } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/reauth-needed-banner.types";
import {
  addSlugToSet,
  removeSlugFromSet,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigsManager.helpers";
import { resolveLocalizedString } from "@/shared/lib/localized-string";

function deriveConnectionState(
  slug: string,
  connectingSlugs: ReadonlySet<string>,
  reauthProviderSlugs: ReadonlySet<string>,
  reauthExpiryStates: ReadonlyMap<string, ExpiryState>,
  hasToken: boolean
): ConnectionState {
  if (connectingSlugs.has(slug)) {
    return "connecting";
  }
  if (reauthProviderSlugs.has(slug)) {
    const expiryState = reauthExpiryStates.get(slug);
    return expiryState === "expired" ? "expired" : "expiring";
  }
  return hasToken ? "connected" : "disconnected";
}

/** Provider slug → connected email, derived from OAuth token rows. */
function buildConnectedProviderMap(
  connectedProvidersData: MyConnectedMeetingProvidersQuery | undefined
): ReadonlyMap<string, string | null> {
  const map = new Map<string, string | null>();
  for (const token of connectedProvidersData?.myConnectedMeetingProviders ?? []) {
    const slug = token?.providerSlug;
    if (slug != null) {
      map.set(slug, token?.email ?? null);
    }
  }
  return map;
}

/** Auto-generation provider rows for the ConnectProviderAccount list. Only
 *  providers that support auto-generation and are not manual meeting-URL
 *  providers are included — manual providers don't need OAuth and are managed
 *  via the config form. Connection state is derived from OAuth token
 *  existence, not config existence. */
function buildConnectProviderAccountItems(
  allProviders: NonNullable<MeetingProvidersQuery["meetingProviders"]>,
  connectedProviderMap: ReadonlyMap<string, string | null>,
  connectingSlugs: ReadonlySet<string>,
  reauthProviderSlugs: ReadonlySet<string>,
  reauthExpiryStates: ReadonlyMap<string, ExpiryState>,
  locale: string
): readonly {
  readonly providerSlug: string;
  readonly providerName: string;
  readonly connectionState: ConnectionState;
  readonly connectedEmail?: string;
}[] {
  const result: {
    providerSlug: string;
    providerName: string;
    connectionState: ConnectionState;
    connectedEmail?: string;
  }[] = [];

  for (const provider of allProviders) {
    const supportsAutoGen = provider.fieldSchema?.supportsAutoGeneration === true;
    const providerKind = provider.providerKind ?? "manual";
    if (!supportsAutoGen) continue;
    if (providerKind === "manual") continue;

    const slug = provider.slug ?? "";
    if (!slug) continue;

    const providerName = provider.name ? resolveLocalizedString(provider.name, locale) : slug;
    const hasToken = connectedProviderMap.has(slug);

    result.push({
      providerSlug: slug,
      providerName,
      connectionState: deriveConnectionState(slug, connectingSlugs, reauthProviderSlugs, reauthExpiryStates, hasToken),
      connectedEmail: connectedProviderMap.get(slug) ?? undefined,
    });
  }
  return result;
}

interface ConnectAccountsArgs {
  readonly providersData: MeetingProvidersQuery | undefined;
  readonly connectedProvidersData: MyConnectedMeetingProvidersQuery | undefined;
  readonly reauthProviderSlugs: ReadonlySet<string>;
  readonly reauthExpiryStates: ReadonlyMap<string, ExpiryState>;
  readonly locale: string;
}

/** Derives the ConnectProviderAccount rows and owns the per-provider
 *  "connecting" flags set during OAuth authorize requests. */
export function useMeetingConfigsManagerConnectAccounts({
  providersData,
  connectedProvidersData,
  reauthProviderSlugs,
  reauthExpiryStates,
  locale,
}: ConnectAccountsArgs) {
  const [connectingSlugs, setConnectingSlugs] = useState<ReadonlySet<string>>(() => new Set());

  const connectedProviderMap = useMemo(
    () => buildConnectedProviderMap(connectedProvidersData),
    [connectedProvidersData]
  );

  const connectProviderAccountItems = useMemo(
    () =>
      buildConnectProviderAccountItems(
        providersData?.meetingProviders ?? [],
        connectedProviderMap,
        connectingSlugs,
        reauthProviderSlugs,
        reauthExpiryStates,
        locale
      ),
    [
      providersData?.meetingProviders,
      connectedProviderMap,
      connectingSlugs,
      reauthProviderSlugs,
      reauthExpiryStates,
      locale,
    ]
  );

  const addConnectingSlug = useCallback((slug: string) => setConnectingSlugs(prev => addSlugToSet(prev, slug)), []);

  const removeConnectingSlug = useCallback(
    (slug: string) => setConnectingSlugs(prev => removeSlugFromSet(prev, slug)),
    []
  );

  return {
    view: { connectProviderAccountItems },
    addConnectingSlug,
    removeConnectingSlug,
  };
}

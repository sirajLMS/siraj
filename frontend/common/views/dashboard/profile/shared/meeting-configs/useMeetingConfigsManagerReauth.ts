"use client";

import { useCallback, useMemo, useState } from "react";
import type { UserMeetingConfigFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  ExpiryState,
  ReauthProvider,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/reauth-needed-banner.types";
import {
  addSlugToSet,
  removeSlugFromSet,
  SEVEN_DAYS_MS,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigsManager.helpers";
import { resolveLocalizedString } from "@/shared/lib/localized-string";

interface ReauthArgs {
  readonly configs: readonly UserMeetingConfigFieldsFragment[];
  readonly locale: string;
}

/** Configs whose OAuth tokens expire within the proactive window, with ms-until-expiry. */
function collectExpiringConfigs(
  configs: readonly UserMeetingConfigFieldsFragment[],
  nowTimestamp: number
): ReadonlyArray<{ slug: string; msUntilExpiry: number }> {
  const result: { slug: string; msUntilExpiry: number }[] = [];
  for (const config of configs) {
    const expiresAtRaw = config.oauthTokenExpiresAt;
    if (!expiresAtRaw) continue;
    const expiresAt = new Date(expiresAtRaw).getTime();
    if (Number.isNaN(expiresAt)) continue;
    const slug = config.provider?.slug;
    if (!slug) continue;
    const msUntilExpiry = expiresAt - nowTimestamp;
    if (msUntilExpiry <= SEVEN_DAYS_MS) {
      result.push({ slug, msUntilExpiry });
    }
  }
  return result;
}

function collectProactiveSlugs(expiringConfigs: ReadonlyArray<{ slug: string }>): ReadonlySet<string> {
  const slugs = new Set<string>();
  for (const { slug } of expiringConfigs) {
    slugs.add(slug);
  }
  return slugs;
}

function collectExpiryStates(
  expiringConfigs: ReadonlyArray<{ slug: string; msUntilExpiry: number }>
): ReadonlyMap<string, ExpiryState> {
  const states = new Map<string, ExpiryState>();
  for (const { slug, msUntilExpiry } of expiringConfigs) {
    const state: ExpiryState = msUntilExpiry <= 0 ? "expired" : "expiring_soon";
    states.set(slug, state);
  }
  return states;
}

function buildTokenExpiryMap(configs: readonly UserMeetingConfigFieldsFragment[]): ReadonlyMap<string, Date> {
  const map = new Map<string, Date>();
  for (const c of configs) {
    const slug = c.provider?.slug;
    const raw = c.oauthTokenExpiresAt;
    if (!slug || !raw) continue;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) continue;
    map.set(slug, date);
  }
  return map;
}

function buildRequiresReconnect(
  configs: readonly UserMeetingConfigFieldsFragment[],
  reauthProviderSlugs: ReadonlySet<string>,
  locale: string
): ReadonlyArray<{ providerSlug: string; providerName: string }> {
  const result: { providerSlug: string; providerName: string }[] = [];
  for (const c of configs) {
    const slug = c.provider?.slug;
    if (slug != null && reauthProviderSlugs.has(slug)) {
      result.push({
        providerSlug: slug,
        providerName: c.provider?.name ? resolveLocalizedString(c.provider.name, locale) : slug,
      });
    }
  }
  return result;
}

function buildReauthProviders(
  configs: readonly UserMeetingConfigFieldsFragment[],
  reauthProviderSlugs: ReadonlySet<string>,
  reauthExpiryStates: ReadonlyMap<string, ExpiryState>,
  locale: string
): readonly ReauthProvider[] {
  const result: ReauthProvider[] = [];
  for (const c of configs) {
    const slug = c.provider?.slug;
    if (slug != null && reauthProviderSlugs.has(slug)) {
      result.push({
        slug,
        name: c.provider?.name ? resolveLocalizedString(c.provider.name, locale) : slug,
        expiryState: reauthExpiryStates.get(slug),
      });
    }
  }
  return result;
}

/** Tracks which providers need re-authentication. Proactive detection is
 *  derived from config token expiry timestamps during render; reactive
 *  additions come from mutation failures via the add/remove helpers. */
export function useMeetingConfigsManagerReauth({ configs, locale }: ReauthArgs) {
  const [reactiveReauthSlugs, setReactiveReauthSlugs] = useState<ReadonlySet<string>>(() => new Set());
  const [nowTimestamp] = useState(() => Date.now());

  const expiringConfigs = useMemo(() => collectExpiringConfigs(configs, nowTimestamp), [configs, nowTimestamp]);
  const proactiveReauthSlugs = useMemo(() => collectProactiveSlugs(expiringConfigs), [expiringConfigs]);
  const proactiveExpiryStates = useMemo(() => collectExpiryStates(expiringConfigs), [expiringConfigs]);

  const reauthProviderSlugs = useMemo<ReadonlySet<string>>(() => {
    const merged = new Set(reactiveReauthSlugs);
    for (const slug of proactiveReauthSlugs) {
      merged.add(slug);
    }
    return merged;
  }, [reactiveReauthSlugs, proactiveReauthSlugs]);

  const reauthExpiryStates = proactiveExpiryStates;
  const requiresReconnect = useMemo(
    () => buildRequiresReconnect(configs, reauthProviderSlugs, locale),
    [configs, reauthProviderSlugs, locale]
  );
  const reauthProviders = useMemo(
    () => buildReauthProviders(configs, reauthProviderSlugs, reauthExpiryStates, locale),
    [configs, reauthProviderSlugs, reauthExpiryStates, locale]
  );
  const providerTokenExpiryMap = useMemo(() => buildTokenExpiryMap(configs), [configs]);
  const reconnectAllTargetSlugs = useMemo<readonly string[]>(() => reauthProviders.map(p => p.slug), [reauthProviders]);

  const addReactiveSlug = useCallback((slug: string) => setReactiveReauthSlugs(prev => addSlugToSet(prev, slug)), []);

  const removeReactiveSlug = useCallback(
    (slug: string) => setReactiveReauthSlugs(prev => removeSlugFromSet(prev, slug)),
    []
  );

  return {
    view: { requiresReconnect, reauthProviders, providerTokenExpiryMap, reconnectAllTargetSlugs },
    reauthProviderSlugs,
    reauthExpiryStates,
    addReactiveSlug,
    removeReactiveSlug,
  };
}

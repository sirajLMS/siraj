import { CombinedGraphQLErrors } from "@apollo/client";
import type { MeetingConfigListItem } from "@/frontend/common/components/ui/display/meetingConfig/MeetingConfigList";
import {
  MeetingIntegrationProviderSlug,
  type UserMeetingConfigFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { resolveLocalizedString } from "@/shared/lib/localized-string";

/** Error code emitted by the backend when a provider token is expired or revoked. */
const PROVIDER_REAUTH_REQUIRED_CODE = "PROVIDER_REAUTH_REQUIRED";

/** Proactive token-expiry horizon: providers whose tokens expire within this window are flagged for re-auth. */
export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** Progress tracking state for the "Reconnect All" batch flow. `current` is
 *  1-based, `total` is the number of providers to attempt, and `providerSlug`
 *  identifies the provider currently being reconnected. `null` when idle. */
export interface ReconnectAllProgress {
  readonly current: number;
  readonly total: number;
  readonly providerSlug: string;
}

export type GenerationStatus = "idle" | "generating" | "success" | "error";

export type GeneratePreviewArgs = {
  readonly providerId: string;
  readonly topic: string;
  readonly startDateTime?: string;
  readonly durationMinutes?: number;
};

/** Returns the ISO date string for the Monday of the current week. */
export function currentWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = (day === 0 ? -6 : 1 - day) * 24 * 60 * 60 * 1000;
  const monday = new Date(now.getTime() - diff);
  return monday.toISOString().split("T")[0] ?? "";
}

/** Display label for a meeting config: explicit label, localized provider name, or slug/id fallback. */
export function configLabel(config: UserMeetingConfigFieldsFragment, locale: string): string {
  if (config.label?.trim()) return config.label.trim();
  if (config.provider?.name) return resolveLocalizedString(config.provider.name, locale);
  return config.provider?.slug ?? config.id ?? "";
}

/** Returns `null` if the currently expanded config belongs to the given
 *  provider slug (so we collapse it), otherwise returns the previous value
 *  unchanged. Used as a state updater for the expanded bookings id. */
export function collapseProviderExpandedId(
  configById: ReadonlyMap<string, UserMeetingConfigFieldsFragment>,
  providerSlug: string,
  prev: string | null
): string | null {
  if (prev == null) return null;
  const config = configById.get(prev);
  return config?.provider?.slug === providerSlug ? null : prev;
}

export function isUserMeetingConfig(config: MeetingConfigListItem): config is UserMeetingConfigFieldsFragment {
  return "userId" in config;
}

export function isMeetingIntegrationProviderSlug(value: string): value is MeetingIntegrationProviderSlug {
  return (Object.values(MeetingIntegrationProviderSlug) as readonly string[]).includes(value);
}

/** Returns a new set with `slug` added (immutably). */
export function addSlugToSet(prev: ReadonlySet<string>, slug: string): Set<string> {
  const next = new Set(prev);
  next.add(slug);
  return next;
}

/** Returns a new set with `slug` removed (immutably). */
export function removeSlugFromSet(prev: ReadonlySet<string>, slug: string): Set<string> {
  const next = new Set(prev);
  next.delete(slug);
  return next;
}

/** Whether the error carries the backend's provider-reauth-required code (expired or revoked token). */
export function isProviderReauthError(caughtError: unknown): boolean {
  if (!CombinedGraphQLErrors.is(caughtError)) return false;
  return caughtError.errors.some(e => e.extensions?.code === PROVIDER_REAUTH_REQUIRED_CODE);
}

/** Finds the provider slug of the config whose provider has the given id, if any. */
export function findConfigSlugByProviderId(
  configs: readonly UserMeetingConfigFieldsFragment[],
  providerId: string
): string | null {
  return configs.find(c => c.provider?.id === providerId)?.provider?.slug ?? null;
}

import type { UserMeetingConfigFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import type { useMeetingConfigsManagerViewModel } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigsManagerViewModel";
import { resolveLocalizedString } from "@/shared/lib/localized-string";

export type MeetingConfigsManagerState = ReturnType<typeof useMeetingConfigsManagerViewModel>;

/**
 * Mount-time fade-in for the settings cross-link button. Defined once so the
 * animation plays on mount without a reduced-motion media-query hook.
 */
export const CROSS_LINK_FADE_IN_SX = {
  "@keyframes meetingConfigCrossLinkFadeIn": {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  animation: "meetingConfigCrossLinkFadeIn 200ms ease-out",
  "@media (prefers-reduced-motion: reduce)": { animation: "none" },
} as const;

type ProviderMeta = { meetingId?: string; spaceName?: string };

export function isProviderMeta(value: unknown): value is ProviderMeta {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const meetingId = "meetingId" in value ? value.meetingId : undefined;
  const spaceName = "spaceName" in value ? value.spaceName : undefined;
  const meetingIdValid = meetingId === undefined || typeof meetingId === "string";
  const spaceNameValid = spaceName === undefined || typeof spaceName === "string";
  return meetingIdValid && spaceNameValid;
}

export function buildProviderNameMap(
  connectProviderAccountItems: MeetingConfigsManagerState["connectProviderAccountItems"],
  configs: readonly UserMeetingConfigFieldsFragment[],
  locale: string
): Map<string, string> {
  const map = new Map<string, string>();
  for (const item of connectProviderAccountItems) {
    map.set(item.providerSlug, item.providerName);
  }
  for (const c of configs) {
    const slug = c.provider?.slug;
    if (slug && !map.has(slug)) {
      map.set(slug, c.provider?.name ? resolveLocalizedString(c.provider.name, locale) : slug);
    }
  }
  return map;
}

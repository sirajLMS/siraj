import type {
  MeetingConfigDetails,
  MeetingProviderFieldSchema,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";

type MeetingProviderFieldVisibility = {
  readonly fieldSchema: MeetingProviderFieldSchema | MeetingProviderFieldsFragment["fieldSchema"];
};

export function isUrlAllowedByProvider(url: string, allowlist: readonly string[]): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return allowlist.some(pattern => {
      const normalized = pattern.toLowerCase().replace(/^\*\./, "");
      return hostname === normalized || hostname.endsWith(`.${normalized}`);
    });
  } catch {
    return false;
  }
}

export function getVisibleMeetingConfigFields(provider: MeetingProviderFieldVisibility): {
  showUsername: boolean;
  showPassword: boolean;
  showTenantId: boolean;
} {
  return {
    showUsername: provider.fieldSchema?.supportsUsername === true,
    showPassword: provider.fieldSchema?.supportsPassword === true,
    showTenantId: provider.fieldSchema?.supportsTenantId === true,
  };
}

const MEETING_ID_PATTERNS: Record<string, RegExp> = {
  zoom: /\/j\/(\d+)/,
  google_meet: /meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/i,
  microsoft_teams: /\/meetup-join\/([^/?]+)/i,
};

export function extractMeetingId(providerSlug: string, url: string): string | null {
  const pattern = MEETING_ID_PATTERNS[providerSlug];
  if (!pattern) {
    return null;
  }
  const match = pattern.exec(url);
  return match?.[1] ?? null;
}

export function getMeetingJoinUrlFromDetails(details: MeetingConfigDetails): string {
  return details.meetingUrl ?? "";
}

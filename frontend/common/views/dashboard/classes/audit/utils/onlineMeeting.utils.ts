// NEW FOR PLAN v5: Lifted pure-data helper out of tier (specs.md §5 N9 violation).
import type { OnlineMeetingInfo } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { EffectiveMeetingFieldsFragment } from "@/frontend/common/graphql/types/meeting-class-config.operations";
import { resolveLocalizedString } from "@/shared/lib/localized-string";

export function resolveProviderDisplayName(
  meetingInfo: OnlineMeetingInfo | null | undefined,
  locale: string
): string | null {
  if (!meetingInfo) return null;
  if (meetingInfo.providerName) {
    return resolveLocalizedString(meetingInfo.providerName, locale);
  }
  return meetingInfo.platform?.trim() ?? null;
}

export function toEffectiveMeeting(
  meetingInfo: OnlineMeetingInfo | null | undefined
): EffectiveMeetingFieldsFragment | null {
  if (!meetingInfo) return null;
  return {
    joinUrl: meetingInfo.joinUrl,
    logoUrl: meetingInfo.logoUrl,
    providerName: meetingInfo.providerName,
    source: meetingInfo.source,
    providerSlug: meetingInfo.platform,
    meetingId: meetingInfo.meetingId,
    configId: null,
    providerId: null,
    supportsAutoGeneration: false,
  };
}

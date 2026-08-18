// NEW FOR PLAN v5: lifted from
//   frontend/common/components/ui/display/meetingConfig/utils/meetingConfigDisplay.utils.ts
//   to frontend/common/lib/effectiveMeetingToDisplayData.ts so tier importers use a §2.4-allowlisted path.

import type { MeetingConfigDisplayData } from "@/frontend/common/components/ui/display/meetingConfig/types/meetingConfigDisplay.types";
import type { EffectiveMeetingFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";

export function effectiveMeetingToDisplayData(meeting: EffectiveMeetingFieldsFragment): MeetingConfigDisplayData {
  return {
    providerSlug: meeting.providerSlug,
    providerName: meeting.providerName,
    logoUrl: meeting.logoUrl,
    meetingId: meeting.meetingId,
    source: meeting.source,
    details: { meetingUrl: meeting.joinUrl },
  };
}

// NEW FOR PLAN v5 (lifted from frontend/{mobile,desktop}/components/ui/display/meetingConfig/meetingConfigDisplay.types.ts)

import type { MeetingConfigDisplayData } from "@/frontend/common/components/ui/display/meetingConfig/types/meetingConfigDisplay.types";
import type { EffectiveMeetingFieldsFragment } from "@/frontend/common/graphql/types/meeting-class-config.operations";

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

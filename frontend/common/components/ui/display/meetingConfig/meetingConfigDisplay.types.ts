import type { EffectiveMeetingFieldsFragment } from "@/frontend/common/graphql/types/meeting-class-config.operations";
import type { EffectiveMeetingSource } from "@/frontend/common/types/meeting-class-config.graphql.types";

export type MeetingConfigDisplayData = {
  readonly id?: string;
  readonly label?: string | null;
  readonly isDefault?: boolean;
  readonly providerSlug?: string | null;
  readonly providerName?: Partial<Record<"ar" | "en", string>> | null;
  readonly logoUrl?: string | null;
  readonly meetingId?: string | null;
  readonly source?: EffectiveMeetingSource | string | null;
  readonly details?: {
    readonly meetingUrl?: string | null;
    readonly username?: string | null;
    readonly tenantId?: string | null;
  } | null;
  readonly masked?: boolean;
  readonly hasSecret?: boolean;
};

export type MeetingConfigDisplayProps = {
  readonly config: MeetingConfigDisplayData;
  readonly showSource?: boolean;
  readonly compact?: boolean;
};

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

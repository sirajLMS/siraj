// NEW FOR PLAN v5 (lifted from frontend/{mobile,desktop}/components/ui/display/meetingConfig/meetingConfigDisplay.types.ts)
import type { EffectiveMeetingSource } from "@/frontend/common/graphql/generated/gql/graphql-types";

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

// NEW FOR PLAN v5 (lifted from frontend/{mobile,desktop}/components/ui/display/meetingConfig/MeetingJoinAction.{mobile,desktop}.tsx)
import type { EffectiveMeetingFieldsFragment } from "@/frontend/common/graphql/types/meeting-class-config.operations";

export type MeetingJoinEmptyRole = "teacher" | "parent" | "class";

export type MeetingJoinActionProps = {
  readonly joinUrl?: string | null;
  readonly meeting?: EffectiveMeetingFieldsFragment | null;
  readonly label?: string;
  readonly variant?: "button" | "action" | "icon";
  readonly disabled?: boolean;
  readonly id?: string;
  readonly onJoinAction?: () => void;
  readonly emptyRole?: MeetingJoinEmptyRole;
  readonly setupHref?: string;
};

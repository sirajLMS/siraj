// NEW FOR PLAN v5 (lifted from frontend/{mobile,desktop}/components/ui/display/meetingConfig/MeetingConfigList.{mobile,desktop}.tsx)
import type {
  ClassMeetingConfigFieldsFragment,
  UserMeetingConfigFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/operations";

export type MeetingConfigListItem = UserMeetingConfigFieldsFragment | ClassMeetingConfigFieldsFragment;

export type MeetingConfigListProps = {
  readonly configs: readonly MeetingConfigListItem[];
  readonly title?: string;
  readonly loading?: boolean;
  readonly onSetDefaultAction?: (id: string) => void;
  readonly onEditAction?: (config: MeetingConfigListItem) => void;
  readonly onDeleteAction?: (id: string) => void;
  readonly emptyMessage?: string;
  readonly requiresReconnect?: readonly string[];
  /** Extra React content rendered below each config card (e.g. badge + bookings link). */
  readonly renderRowExtra?: (config: MeetingConfigListItem) => React.ReactNode;
};

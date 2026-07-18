export type {
  MeetingConfigDisplayData as DesktopMeetingConfigDisplayData,
  MeetingConfigDisplayProps as DesktopMeetingConfigDisplayProps,
} from "@/frontend/common/components/ui/display/meetingConfig/types";
export { effectiveMeetingToDisplayData } from "@/frontend/common/components/ui/display/meetingConfig/utils";
export { DesktopMeetingConfigDisplay } from "@/frontend/desktop/components/ui/display/meetingConfig/MeetingConfigDisplay.desktop";
export {
  DesktopMeetingConfigList,
  type DesktopMeetingConfigListItem,
  type DesktopMeetingConfigListProps,
} from "@/frontend/desktop/components/ui/display/meetingConfig/MeetingConfigList.desktop";
export {
  DesktopMeetingJoinAction,
  type DesktopMeetingJoinActionProps,
  type DesktopMeetingJoinEmptyRole,
} from "@/frontend/desktop/components/ui/display/meetingConfig/MeetingJoinAction.desktop";

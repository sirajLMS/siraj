import { EventRepeatOutlined, NotificationsActiveOutlined, TimelineOutlined } from "@mui/icons-material";
import type { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import { getVisibleTabs, type TabDefinition } from "@/frontend/common/views/dashboard/lib/tabbedPane";
import type {
  ScheduleTrackingTabId,
  ScheduleTrackingTabLabelKey,
} from "@/frontend/common/views/dashboard/schedule/tracking/tabs/types";

export const SCHEDULE_TRACKING_TABS: readonly TabDefinition<ScheduleTrackingTabId, ScheduleTrackingTabLabelKey>[] = [
  {
    id: "reschedule",
    labelKey: "reschedule",
    permissions: PAGE_PERMISSIONS.scheduleTrackingReschedule,
    icon: EventRepeatOutlined,
  },
  {
    id: "status",
    labelKey: "status",
    permissions: PAGE_PERMISSIONS.scheduleTrackingStatus,
    icon: TimelineOutlined,
  },
  {
    id: "alerts",
    labelKey: "alerts",
    permissions: PAGE_PERMISSIONS.scheduleTrackingAlerts,
    icon: NotificationsActiveOutlined,
  },
] as const;

export function getVisibleScheduleTrackingTabs(
  hasPermission: (permission: AppPermission) => boolean
): TabDefinition<ScheduleTrackingTabId, ScheduleTrackingTabLabelKey>[] {
  return getVisibleTabs<ScheduleTrackingTabId, ScheduleTrackingTabLabelKey>(SCHEDULE_TRACKING_TABS, hasPermission);
}

import { createTabbedPaneStore } from "@/frontend/common/stores/createTabbedPaneStore";
import {
  SCHEDULE_TRACKING_TAB_IDS,
  type ScheduleTrackingTabId,
} from "@/frontend/common/views/dashboard/schedule/tracking/tabs/types";

export const useScheduleTrackingTabsStore = createTabbedPaneStore<ScheduleTrackingTabId>(SCHEDULE_TRACKING_TAB_IDS);

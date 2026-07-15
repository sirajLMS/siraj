import type {
  ParentBookingStatus,
  ParentLiveClassStatus,
} from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardTypes";
import type { ParentDashboardLabels as NewParentDashboardLabels } from "@/shared/locale/types/dashboard/core/parentDashboard";

export type ParentDashboardLabels = Omit<NewParentDashboardLabels, "bookingStatus" | "liveClassStatus"> & {
  readonly bookingStatus: Record<ParentBookingStatus, string>;
  readonly liveClassStatus: Record<ParentLiveClassStatus, string>;
};

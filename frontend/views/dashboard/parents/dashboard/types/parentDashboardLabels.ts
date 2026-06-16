import type { MessageSchema } from "@/frontend/messages/types/message";
import type { ParentBookingStatus, ParentLiveClassStatus } from "@/frontend/stores/parentDashboardStore";

type ParentDashboardMessages = MessageSchema["dashboard"]["parentDashboard"];

export type ParentDashboardLabels = Omit<ParentDashboardMessages, "bookingStatus" | "liveClassStatus"> & {
  readonly bookingStatus: Record<ParentBookingStatus, string>;
  readonly liveClassStatus: Record<ParentLiveClassStatus, string>;
};

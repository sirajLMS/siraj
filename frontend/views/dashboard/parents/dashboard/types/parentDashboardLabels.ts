import type { MessageSchema } from "@/shared/messages/types/message";
import type { ParentBookingStatus, ParentLiveClassStatus } from "./parentDashboardTypes";

type ParentDashboardMessages = MessageSchema["dashboard"]["parentDashboard"];

export type ParentDashboardLabels = Omit<ParentDashboardMessages, "bookingStatus" | "liveClassStatus"> & {
  readonly bookingStatus: Record<ParentBookingStatus, string>;
  readonly liveClassStatus: Record<ParentLiveClassStatus, string>;
};

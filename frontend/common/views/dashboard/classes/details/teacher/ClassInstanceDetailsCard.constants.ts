import type { SessionBadgeStatus } from "@/frontend/common/views/dashboard/classes/details/teacher/ClassInstanceDetailsCard.types";
import type { ClassInstanceStatus } from "@/frontend/common/views/dashboard/types/dashboard";

// Maps class-instance lifecycle status to the badge status tokens of the `session` category.
export const SESSION_BADGE_STATUS: Record<ClassInstanceStatus, SessionBadgeStatus> = {
  active: "active",
  scheduled: "confirmed",
  pending: "pending",
  completed: "completed",
  cancelled: "cancelled",
};

"use client";

import type { TeacherScheduleStatusContentProps } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps";
import { resolveTeacherScheduleActionTooltips } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/resolveTeacherScheduleActionTooltips";
import {
  getStatusLabel,
  resolveTeacherStatusBadge,
} from "@/frontend/common/views/dashboard/teachers/dashboard/utils/sessionStatusUtils";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge";
import { SessionActivateButtonMobile } from "@/frontend/mobile/views/dashboard/teachers/dashboard/components/sessionActivateButton.mobile";

/**
 * Mobile variant of the schedule-row status content.
 * Renders the activate button (full-width on mobile) while the row is in the
 * pending/connecting window, otherwise a compact status badge.
 *
 * Plan v5: per specs.md §3 N3 + §6.4, the `<RequirePermission>` wrapper was
 * lifted to the `TeacherDashboardContainer`; the resulting `hasSessionActivateClass`
 * boolean is now passed in as a prop.
 */
export function TeacherScheduleStatusContentMobile({
  row,
  labels,
  canActivate,
  onActivate,
  hasSessionActivateClass,
}: Readonly<TeacherScheduleStatusContentProps>) {
  if (canActivate && (hasSessionActivateClass ?? true) && (row.status === "pending" || row.status === "connecting")) {
    const tooltips = resolveTeacherScheduleActionTooltips(row, labels, labels.meetingLabels);
    return (
      <SessionActivateButtonMobile
        disabled={!row.activateEnabled}
        isConnecting={row.status === "connecting"}
        activateLabel={labels.actions.activate}
        connectingLabel={labels.actions.connecting}
        tooltip={tooltips.activate}
        onActivate={() => onActivate?.(row.id)}
      />
    );
  }

  const badge = resolveTeacherStatusBadge(row.status);
  return (
    <MobileStatusBadge
      category={badge.category}
      status={badge.status}
      label={getStatusLabel(row.status, labels.status)}
      size="small"
    />
  );
}

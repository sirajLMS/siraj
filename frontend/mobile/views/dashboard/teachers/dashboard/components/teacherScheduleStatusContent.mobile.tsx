"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { StatusBadge } from "@/frontend/common/components/ui";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { TeacherScheduleRow } from "@/frontend/common/stores/teacherDashboardTypes";
import type { TeacherDashboardViewLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";
import { resolveTeacherScheduleActionTooltips } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/resolveTeacherScheduleActionTooltips";
import {
  getStatusLabel,
  resolveTeacherStatusBadge,
} from "@/frontend/common/views/dashboard/teachers/dashboard/utils/sessionStatusUtils";
import { SessionActivateButtonMobile } from "@/frontend/mobile/views/dashboard/teachers/dashboard/components/sessionActivateButton.mobile";

interface TeacherScheduleStatusContentMobileProps {
  readonly row: TeacherScheduleRow;
  readonly labels: TeacherDashboardViewLabels;
  readonly canActivate: boolean;
  readonly onActivate?: (id: string) => void;
}

/**
 * Mobile variant of the schedule-row status content.
 * Renders the activate button (full-width on mobile) while the row is in the
 * pending/connecting window, otherwise a compact status badge.
 */
export function TeacherScheduleStatusContentMobile({
  row,
  labels,
  canActivate,
  onActivate,
}: Readonly<TeacherScheduleStatusContentMobileProps>) {
  if (canActivate && (row.status === "pending" || row.status === "connecting")) {
    const tooltips = resolveTeacherScheduleActionTooltips(row, labels, labels.meetingLabels);
    return (
      <RequirePermission permissions={[AppPermission.SessionActivateClass]}>
        <SessionActivateButtonMobile
          disabled={!row.activateEnabled}
          isConnecting={row.status === "connecting"}
          activateLabel={labels.actions.activate}
          connectingLabel={labels.actions.connecting}
          tooltip={tooltips.activate}
          onActivate={() => onActivate?.(row.id)}
        />
      </RequirePermission>
    );
  }

  const badge = resolveTeacherStatusBadge(row.status);
  return (
    <StatusBadge
      category={badge.category}
      status={badge.status}
      label={getStatusLabel(row.status, labels.status)}
      size="small"
    />
  );
}

"use client";

import { Box } from "@mui/material";
import { OpenRequestsWidget } from "@/frontend/common/views/dashboard/widgets/OpenRequestsWidget";
import { QuickActionStrip } from "@/frontend/common/views/dashboard/widgets/QuickActionStrip";
import { Translation, useAppTranslation } from "@/shared/locale";

export function StudentDashboardWidgets() {
  const t = useAppTranslation(Translation.Dashboard.StudentPortalDashboard).widgets;

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <QuickActionStrip
        labels={{
          complaints: t.quickAction.complaints,
          payments: t.quickAction.payments,
          calendar: t.quickAction.calendar,
          appraisals: t.quickAction.appraisals,
        }}
      />
      <Box sx={{ mt: 2 }}>
        <OpenRequestsWidget
          labels={{
            title: t.openRequests.title,
            emptyState: t.openRequests.emptyState,
            emptyStateDescription: t.openRequests.emptyStateDescription,
            viewAll: t.openRequests.viewAll,
          }}
          statusLabels={{
            pending: t.openRequests.status.pending,
            approved: t.openRequests.status.approved,
            rejected: t.openRequests.status.rejected,
            rescheduled: t.openRequests.status.rescheduled,
            cancelled: t.openRequests.status.cancelled,
          }}
          requestTypeLabels={{
            delay: t.openRequests.requestType.delay,
            cancel: t.openRequests.requestType.cancel,
          }}
        />
      </Box>
    </Box>
  );
}

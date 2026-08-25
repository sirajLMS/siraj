"use client";

import { Box } from "@mui/material";
import { OpenRequestsWidget } from "@/frontend/common/views/dashboard/widgets/OpenRequestsWidget";
import { QuickActionStrip } from "@/frontend/common/views/dashboard/widgets/QuickActionStrip";

export function StudentDashboardWidgets() {
  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <QuickActionStrip
        labels={{
          complaints: "Complaints",
          payments: "Payments",
          calendar: "Calendar",
          appraisals: "Appraisals",
        }}
      />
      <Box sx={{ mt: 2 }}>
        <OpenRequestsWidget
          labels={{
            title: "Open Requests",
            emptyState: "No requests yet",
            emptyStateDescription: "You haven't submitted any delay or cancel requests.",
            viewAll: "View All Requests",
          }}
          statusLabels={{
            pending: "Pending",
            approved: "Approved",
            rejected: "Rejected",
            rescheduled: "Rescheduled",
            cancelled: "Cancelled",
          }}
          requestTypeLabels={{
            delay: "Delay",
            cancel: "Cancel",
          }}
        />
      </Box>
    </Box>
  );
}

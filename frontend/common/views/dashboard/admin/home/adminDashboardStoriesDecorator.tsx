import { MockedProvider } from "@apollo/client/testing/react";
import type { Decorator } from "@storybook/nextjs-vite";
import { USER_SELECT_LIMIT } from "@/frontend/common/components/ui/input/userSelect/userSelect.constants";
import { teachersQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useDashboardStore } from "@/frontend/common/stores/dashboardStore";
import {
  MOCK_SCHEDULE,
  MOCK_TEACHERS,
} from "@/frontend/common/views/dashboard/admin/home/adminDashboardStoriesFixtures";
import { buildAdminDashboardMetrics } from "@/frontend/common/views/dashboard/admin/home/utils/adminDashboardMetrics";
import { computeDailyScheduleMetricsFromRows } from "@/shared/lib/schedule/schedule-instance-dashboard-status";

// MockedProvider requires exact query+variables matches; TeacherAutocomplete fires an
// initial `teachers` query with an empty search on mount.
const apolloMocks = [
  {
    request: {
      query: teachersQueryDocument,
      variables: { search: "", limit: USER_SELECT_LIMIT },
    },
    result: { data: { teachers: [] } },
  },
];

/** Seeds the dashboard store with schedule fixtures and provides the Apollo mocks the toolbar queries. */
export const withAdminDashboardStore: Decorator = Story => {
  const mockMetrics = buildAdminDashboardMetrics({
    id: "metrics-mock",
    ...computeDailyScheduleMetricsFromRows(MOCK_SCHEDULE),
  });

  useDashboardStore.setState({
    todayClasses: mockMetrics,
    lastUpdated: "dashboard.admin.updatedMinutesAgo",
    scheduleRows: MOCK_SCHEDULE,
    teachers: MOCK_TEACHERS,
  });

  return (
    <MockedProvider mocks={apolloMocks}>
      <Story />
    </MockedProvider>
  );
};

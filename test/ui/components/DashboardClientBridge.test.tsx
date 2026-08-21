import { afterEach, describe, expect, mock, test } from "bun:test";

import type { MockLink } from "@apollo/client/testing";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen, waitFor } from "@testing-library/react";

import type { ReactNode } from "react";

expect.extend(matchers);

// Mock the heavy child dependencies so we can isolate the poll + idle logic
// in DashboardClientBridge without pulling in DashboardLayout, NotificationDrawer, etc.

await mock.module("@/frontend/common/views/dashboard/components/client/UserStoreInitializer", () => ({
  UserStoreInitializer: () => null,
}));

await mock.module("@/frontend/common/views/dashboard/components/DashboardLayout", () => ({
  DashboardLayout: ({
    notificationCount,
    children,
  }: {
    readonly notificationCount: number;
    readonly children: ReactNode;
  }) => (
    <div data-testid="dashboard-layout" data-notification-count={notificationCount}>
      {children}
    </div>
  ),
}));

await mock.module("@/frontend/common/views/dashboard/components/navbar/notifications/NotificationDrawer", () => ({
  NotificationDrawer: () => <div data-testid="notification-drawer" />,
}));

await mock.module("@/frontend/common/views/dashboard/components/TeacherProfileCompletionRedirect", () => ({
  TeacherProfileCompletionRedirect: () => null,
}));

await mock.module("@/frontend/common/views/dashboard/lib/getDashboardLayoutData", () => ({
  getDashboardLayoutData: () => ({ sidebarGroups: [], sidebarItems: [], bottomNavItems: [] }),
}));

await mock.module(
  "@/frontend/common/views/dashboard/components/navbar/notifications/useNotificationsDrawerViewModel",
  () => ({
    useNotificationsDrawerViewModel: () => ({
      labels: {},
      errorLoadingMessage: "",
      alerts: [],
      unreadCount: 0,
      totalCount: 0,
      loading: false,
      error: undefined,
      drawerOpen: false,
      openDrawer: () => {},
      closeDrawer: () => {},
      markOneRead: async () => {},
      markAllRead: async () => {},
      handleViewEntity: () => {},
      handleReschedule: () => {},
      handleApproveInvoice: async () => {},
      handleRejectInvoice: async () => {},
      handleManagePreferences: () => {},
    }),
  })
);

await mock.module("@/shared/i18n/navigation", () => ({
  useRouter: () => ({
    push: () => {},
    replace: () => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
    prefetch: () => {},
  }),
  usePathname: () => "/",
}));

await mock.module("@/shared/i18n/routing", () => ({
  useRouter: () => ({
    push: () => {},
    replace: () => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
    prefetch: () => {},
  }),
  usePathname: () => "/",
  Link: ({ children, href }: { readonly children: ReactNode; readonly href: string }) => <a href={href}>{children}</a>,
  redirect: () => {},
}));

await mock.module("next/navigation", () => ({
  useRouter: () => ({
    push: () => {},
    replace: () => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
    prefetch: () => {},
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ locale: "en" }),
  redirect: () => {},
}));

import { AppPermission, type MeQuery_me as User } from "@/frontend/common/graphql/generated/gql/graphql";
import { meQueryDocument } from "@/frontend/common/graphql/sharedDocuments/auth/auth.documents";
import {
  DashboardClientBridge,
  NOTIFICATION_COUNT_POLL_INTERVAL_MS,
} from "@/frontend/common/views/dashboard/components/DashboardClientBridge";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale = "en" as const;

function createUser(): User {
  return {
    id: "test-user-id",
    name: "Test User",
    role: "TEACHER",
    permissions: [AppPermission.TeacherViewDashboard],
    avatarUrl: null,
    createdAt: null,
    displayCurrency: null,
    email: null,
    emailVerifiedAt: null,
    notificationCount: 3,
    parentId: null,
    phone: null,
    status: null,
    teacherId: null,
    updatedAt: null,
  };
}

const meQueryMock = (notificationCount: number) => ({
  request: { query: meQueryDocument },
  result: {
    data: {
      me: {
        id: "test-user-id",
        name: "Test User",
        email: null,
        emailVerifiedAt: null,
        createdAt: null,
        updatedAt: null,
        avatarUrl: null,
        phone: null,
        status: "ACTIVE",
        permissions: [AppPermission.TeacherViewDashboard],
        role: "TEACHER",
        notificationCount,
        teacherId: null,
        parentId: null,
        displayCurrency: null,
        __typename: "User",
      },
    },
  },
});

afterEach(() => {
  cleanup();
});

describe("DashboardClientBridge — poll interval constant", () => {
  test("NOTIFICATION_COUNT_POLL_INTERVAL_MS is 120_000 (2 minutes)", () => {
    expect(NOTIFICATION_COUNT_POLL_INTERVAL_MS).toBe(120_000);
  });
});

describe("DashboardClientBridge — me query rendering", () => {
  test("renders with fallback notificationCount before me query resolves", async () => {
    renderWithWrapper(
      <DashboardClientBridge
        userProfile={createUser()}
        isSuperAdmin={false}
        roleLabel="Teacher"
        appTitle="Siraj"
        logoAriaLabel="Siraj"
        enableUsersDirectory={false}
      >
        <div data-testid="child" />
      </DashboardClientBridge>,
      {
        locale,
        permissions: [AppPermission.TeacherViewDashboard],
        mocks: [],
      }
    );

    // Before the me query resolves, the fallback count from userProfile is used.
    await waitFor(() => {
      const layout = screen.getByTestId("dashboard-layout");
      expect(layout.getAttribute("data-notification-count")).toBe("3");
    });
  });

  test("updates notificationCount after me query resolves", async () => {
    const mocks: MockLink.MockedResponse[] = [meQueryMock(7)];

    renderWithWrapper(
      <DashboardClientBridge
        userProfile={createUser()}
        isSuperAdmin={false}
        roleLabel="Teacher"
        appTitle="Siraj"
        logoAriaLabel="Siraj"
        enableUsersDirectory={false}
      >
        <div data-testid="child" />
      </DashboardClientBridge>,
      {
        locale,
        permissions: [AppPermission.TeacherViewDashboard],
        mocks,
      }
    );

    await waitFor(
      () => {
        const layout = screen.getByTestId("dashboard-layout");
        expect(layout.getAttribute("data-notification-count")).toBe("7");
      },
      { timeout: 5000 }
    );
  });
});

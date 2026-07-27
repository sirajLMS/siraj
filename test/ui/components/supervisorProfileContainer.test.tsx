import { mock } from "bun:test";

// Defensive mocks against bleed from earlier test files (Bun mock.module is process-global).
mock.module("next/navigation", () => ({
  useParams: () => ({ locale: "en" }),
  useRouter: () => ({
    push: () => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
    replace: () => {},
    prefetch: () => {},
  }),
  usePathname: () => "/profile",
  useSearchParams: () => new URLSearchParams(),
  redirect: () => {},
}));

mock.module("@/shared/i18n/routing", () => ({
  locales: ["ar", "en"] as const,
  defaultLocale: "en",
  useRouter: () => ({
    push: () => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
    replace: () => {},
    prefetch: () => {},
  }),
  usePathname: () => "/profile",
  Link: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  redirect: () => {},
}));

mock.module("@/shared/i18n/navigation", () => ({
  useRouter: () => ({
    push: mock(() => {}),
    back: mock(() => {}),
    forward: mock(() => {}),
    refresh: mock(() => {}),
    replace: mock(() => {}),
    prefetch: mock(() => {}),
  }),
  usePathname: () => "/profile",
}));

mock.module("@/frontend/common/hooks/useLanguageSwitch", () => ({
  useLanguageSwitch: () => ({ currentLocale: "en", switchLanguage: () => {}, isPending: false }),
}));

import { afterEach, describe, expect, test } from "bun:test";
import type { MockLink } from "@apollo/client/testing";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { profileByUserIdQueryDocument } from "@/frontend/common/graphql/sharedDocuments/profile/profile.documents";
import { useSupervisorProfileViewModel } from "@/frontend/common/views/dashboard/supervisor/profile/useSupervisorProfileViewModel";
import { SupervisorProfileDesktopView } from "@/frontend/desktop/views/dashboard/supervisor/profile/supervisorProfile.desktop";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const targetUserId = "supervisor-user-1";

/**
 * Production-shaped desktop container for tests.
 * Bypasses ResponsiveViewSwitch / next/dynamic (not preloaded for this view).
 */
function SupervisorProfileContainerImpl({ userId }: Readonly<{ userId: string }>) {
  const viewModel = useSupervisorProfileViewModel({ targetUserId: userId });
  return <SupervisorProfileDesktopView {...viewModel} />;
}

const profileMockData = {
  profileByUserId: {
    id: "profile-1",
    userId: targetUserId,
    audience: "STAFF",
    scope: "OWN",
    name: "Sara Supervisor",
    email: "sara@example.com",
    avatarUrl: null,
    teacherId: null,
    parentId: null,
    staffProfileId: "staff-1",
    displayCurrency: null,
    teacherOwnProfile: null,
    teacherAdminProfile: null,
    parentOwnProfile: null,
    parentAdminProfile: null,
    paymentMethods: [],
    paymentMethodDefaults: null,
    associatedStudents: null,
    staffProfile: {
      id: "staff-1",
      staffProfileId: "staff-1",
      name: "Sara Supervisor",
      email: "sara@example.com",
      avatarUrl: null,
      phone: "+201111111111",
      status: "ACTIVE",
      roleSlug: "supervisor",
      roleName: "Supervisor",
      hourlyRate: null,
      rateCurrency: null,
      displayAmount: null,
    },
    staffPermissionGroups: [],
    staffPermissionOverrides: [],
    meetingConfigs: [],
    assignedStudents: null,
  },
};

function createMocks(): MockLink.MockedResponse[] {
  return [
    {
      request: {
        query: profileByUserIdQueryDocument,
        variables: { userId: targetUserId },
      },
      result: { data: profileMockData },
      maxUsageCount: Number.POSITIVE_INFINITY,
    },
  ];
}

afterEach(() => {
  cleanup();
});

describe("SupervisorProfileContainer", () => {
  test("renders supervisor profile fields from mocked GraphQL data", async () => {
    renderWithWrapper(<SupervisorProfileContainerImpl userId={targetUserId} />, {
      locale: "en",
      themeMode: "dark",
      mocks: createMocks(),
      viewport: "desktop",
    });

    await waitFor(() => {
      expect(screen.getByText("Sara Supervisor")).toBeInTheDocument();
    });

    expect(screen.getByText("My Profile")).toBeInTheDocument();
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();

    expect(screen.getByText("Account Information")).toBeInTheDocument();
    expect(screen.getByText("Contact Information")).toBeInTheDocument();
    expect(screen.getByText("Role Information")).toBeInTheDocument();

    expect(screen.getByText("Full Name")).toBeInTheDocument();
    expect(screen.getByText("Account Status")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("sara@example.com")).toBeInTheDocument();
    expect(screen.getByText("Role")).toBeInTheDocument();
    expect(screen.getByText("Supervisor")).toBeInTheDocument();
  });
});

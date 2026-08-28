import { afterEach, describe, expect, mock, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

// Defensive mocks against bleed from earlier test files (Bun mock.module is process-global).
await mockNextNavigation("/profile", {
  locales: ["ar", "en"],
  defaultLocale: "en",
});

await mock.module("@/frontend/common/hooks/useLanguageSwitch", () => ({
  useLanguageSwitch: () => ({ currentLocale: "en", switchLanguage: () => {}, isPending: false }),
}));

import type { MockLink } from "@apollo/client/testing";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { profileByUserIdQueryDocument } from "@/frontend/common/graphql/sharedDocuments/profile/profile.documents";
import { useSupervisorProfileViewModel } from "@/frontend/common/views/dashboard/supervisor/profile/useSupervisorProfileViewModel";
import { SupervisorProfileDesktopView } from "@/frontend/desktop/views/dashboard/supervisor/profile/supervisorProfile.desktop";
import { SupervisorProfileMobileView } from "@/frontend/mobile/views/dashboard/supervisor/profile/supervisorProfile.mobile";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "en";
const labels = readTranslation(Translation.Dashboard.SupervisorPortalProfile, locale);

const targetUserId = "supervisor-user-1";

/**
 * Production-shaped container for tests.
 * Bypasses ResponsiveViewSwitch / next/dynamic (not preloaded for this view).
 */
function SupervisorProfileContainerImpl({ userId }: Readonly<{ userId: string }>) {
  const viewModel = useSupervisorProfileViewModel({ targetUserId: userId });
  return <SupervisorProfileDesktopView {...viewModel} />;
}

function SupervisorProfileMobileContainerImpl({ userId }: Readonly<{ userId: string }>) {
  const viewModel = useSupervisorProfileViewModel({ targetUserId: userId });
  return <SupervisorProfileMobileView {...viewModel} />;
}

const profileMockData = {
  profileByUserId: {
    id: "profile-1",
    userId: targetUserId,
    audience: "STAFF",
    scope: "OWN",
    name: "Sara Supervisor",
    email: "[EMAIL_REDACTED]",
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
      email: "[EMAIL_REDACTED]",
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
      locale,
      themeMode: "dark",
      mocks: createMocks(),
      viewport: "desktop",
    });

    await waitFor(() => {
      expect(screen.getByText("Sara Supervisor")).toBeInTheDocument();
    });

    expect(screen.getByText(labels.pageTitle)).toBeInTheDocument();
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();

    expect(screen.getByText(labels.sections.account)).toBeInTheDocument();
    expect(screen.getByText(labels.sections.contact)).toBeInTheDocument();
    expect(screen.getByText(labels.sections.role)).toBeInTheDocument();

    expect(screen.getByText(labels.fields.fullName)).toBeInTheDocument();
    const statusLabels = screen.getAllByText(labels.fields.status);
    expect(statusLabels.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByText(labels.fields.email)).toBeInTheDocument();
    expect(screen.getByText("[EMAIL_REDACTED]")).toBeInTheDocument();
    expect(screen.getByText(labels.fields.roleName)).toBeInTheDocument();
    expect(screen.getByText("Supervisor")).toBeInTheDocument();
  });

  test("mobile view renders the same account/contact/role sections after profileLayoutShared removal", async () => {
    renderWithWrapper(<SupervisorProfileMobileContainerImpl userId={targetUserId} />, {
      locale,
      themeMode: "dark",
      mocks: createMocks(),
      viewport: "mobile",
    });

    await waitFor(() => {
      expect(screen.getByText("Sara Supervisor")).toBeInTheDocument();
    });

    expect(screen.getByText(labels.pageTitle)).toBeInTheDocument();
    expect(screen.getByText(labels.sections.account)).toBeInTheDocument();
    expect(screen.getByText(labels.sections.contact)).toBeInTheDocument();
    expect(screen.getByText(labels.sections.role)).toBeInTheDocument();
    expect(screen.getByText(labels.fields.fullName)).toBeInTheDocument();
    expect(screen.getByText("[EMAIL_REDACTED]")).toBeInTheDocument();
    expect(screen.getByText("Supervisor")).toBeInTheDocument();
  });
});

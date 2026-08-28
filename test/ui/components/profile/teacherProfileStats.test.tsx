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

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import type {
  TeacherAdminData,
  TeacherOwnData,
} from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes";
import type { TeacherProfileViewModel } from "@/frontend/common/views/dashboard/profile/teacher/useTeacherProfileViewModel";
import { TeacherProfileDesktopView } from "@/frontend/desktop/views/dashboard/profile/teacher/teacherProfile.desktop";
import { TeacherProfileMobileView } from "@/frontend/mobile/views/dashboard/profile/teacher/teacherProfile.mobile";
import { ProfileMode, ProfileScope } from "@/shared/constants/profile.enum";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "en";
const dashboardLabels = readTranslation(Translation.Dashboard.TeacherProfile, locale);

const ownTeacherData: TeacherOwnData = {
  id: "teacher-profile-1",
  name: "Test Teacher",
  email: "teacher@example.com",
  phone: null,
  nationality: null,
  countryCode: null,
  nationalId: null,
  dateOfBirth: null,
  gender: null,
  address: null,
  qualifications: null,
  timezone: null,
  hourlyRate: null,
  rateCurrency: null,
  totalClasses: 12,
  displayAmount: null,
};

const adminTeacherData: TeacherAdminData = {
  ...ownTeacherData,
  userId: "teacher-user-1",
  status: null,
  updatedAt: null,
  avgEngagementScore: 4.26,
};

function buildViewModel(overrides: Partial<TeacherProfileViewModel>): TeacherProfileViewModel {
  return {
    labels: {
      base: readTranslation(Translation.Profile.Base, locale),
      teacher: readTranslation(Translation.Profile.Teacher, locale),
      dashboard: dashboardLabels,
      errors: readTranslation(Translation.Errors, locale),
    },
    teacherData: ownTeacherData,
    avatarUrl: null,
    displayCurrency: undefined,
    profilePhone: undefined,
    profileTimezone: undefined,
    isAdminScope: false,
    targetUserId: "teacher-user-1",
    meetingTabHref: "#meetings",
    mode: ProfileMode.VIEW,
    scope: ProfileScope.OWN,
    isSaving: false,
    onSubmitOwn: async () => {},
    onSubmitAdmin: async () => {},
    loading: false,
    error: undefined,
    refetch: () => {},
    activeTab: "profile",
    onTabChange: () => {},
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

describe("Teacher profile stats metric grids", () => {
  test("desktop tier renders stats via DesktopMetricCardGrid with formatted values", () => {
    const vm = buildViewModel({ teacherData: adminTeacherData, isAdminScope: true });
    const { container } = renderWithWrapper(<TeacherProfileDesktopView {...vm} />, { locale });

    // DesktopMetricCardGrid is a MUI Grid container; InfoField rows never produce one.
    expect(container.querySelector(".MuiGrid-container")).not.toBeNull();
    expect(screen.getByText(dashboardLabels.stats.totalClasses)).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText(dashboardLabels.stats.avgEngagement)).toBeInTheDocument();
    expect(screen.getByText("4.3")).toBeInTheDocument();
  });

  test("mobile tier renders stats via MobileMetricCardGrid (horizontal scroll row, no Grid)", () => {
    const vm = buildViewModel({ teacherData: adminTeacherData, isAdminScope: true });
    const { container } = renderWithWrapper(<TeacherProfileMobileView {...vm} />, { locale });

    expect(container.querySelector(".MuiGrid-container")).toBeNull();
    expect(screen.getByText(dashboardLabels.stats.totalClasses)).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText(dashboardLabels.stats.avgEngagement)).toBeInTheDocument();
    expect(screen.getByText("4.3")).toBeInTheDocument();
  });

  test("hides the avgEngagement metric outside admin scope", () => {
    const vm = buildViewModel({ teacherData: ownTeacherData, isAdminScope: false });
    renderWithWrapper(<TeacherProfileDesktopView {...vm} />, { locale });

    expect(screen.getByText(dashboardLabels.stats.totalClasses)).toBeInTheDocument();
    expect(screen.queryByText(dashboardLabels.stats.avgEngagement)).not.toBeInTheDocument();
  });

  test("hides the avgEngagement metric when admin data exists but scope is non-admin", () => {
    const vm = buildViewModel({ teacherData: adminTeacherData, isAdminScope: false });
    renderWithWrapper(<TeacherProfileDesktopView {...vm} />, { locale });

    expect(screen.getByText(dashboardLabels.stats.totalClasses)).toBeInTheDocument();
    expect(screen.queryByText(dashboardLabels.stats.avgEngagement)).not.toBeInTheDocument();
    expect(screen.queryByText("4.3")).not.toBeInTheDocument();
  });
});

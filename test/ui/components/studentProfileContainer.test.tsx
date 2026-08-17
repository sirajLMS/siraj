import { afterEach, describe, expect, mock, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

// Defensive mocks against bleed from earlier test files (Bun mock.module is process-global).
await mockNextNavigation("/profile", {
  locales: ["ar", "en"],
  defaultLocale: "en",
  searchParams: "tab=profile",
});

await mock.module("@/frontend/common/hooks/useLanguageSwitch", () => ({
  useLanguageSwitch: () => ({ currentLocale: "en", switchLanguage: () => {}, isPending: false }),
}));

import type { MockLink } from "@apollo/client/testing";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { ProfileMode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { studentProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-profile.documents";
import { useStudentPortalProfileStore } from "@/frontend/common/stores/studentPortalProfileStore";
import { useStudentProfileViewModel } from "@/frontend/common/views/dashboard/student/profile/useStudentProfileViewModel";
import { StudentProfileDesktopView } from "@/frontend/desktop/views/dashboard/student/profile/studentProfile.desktop";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { createProfileMockData } from "@/test/ui/components/fixtures/studentHistoryFixtures";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "en";
const labels = readTranslation(Translation.Dashboard.StudentPortalProfile, locale);

const studentId = "student-profile-1";

function StudentProfileContainerImpl() {
  const viewModel = useStudentProfileViewModel({
    scope: ProfileScope.Own,
    mode: ProfileMode.View,
    targetUserId: "student-user-1",
    activeTab: "profile",
  });
  return <StudentProfileDesktopView {...viewModel} />;
}

const profileMockData = createProfileMockData(studentId, {
  dateOfBirth: "2012-05-15T00:00:00.000Z",
  gender: "MALE",
  language: "en",
  email: "ahmed@example.com",
  phone: "+201000000001",
  parentId: "parent-1",
  parentUserId: "parent-user-1",
  parentName: "Parent One",
  parentEmail: "parent@example.com",
  parentPhone: "+201000000002",
});

function createMocks(): MockLink.MockedResponse[] {
  return [
    {
      request: {
        query: studentProfileQueryDocument,
        variables: { studentId: null, year: null, month: null, includeUpcomingClasses: false },
      },
      result: { data: profileMockData },
      maxUsageCount: Number.POSITIVE_INFINITY,
    },
  ];
}

afterEach(() => {
  cleanup();
  useStudentPortalProfileStore.setState({
    isEditing: false,
    draft: {
      phone: "",
      timezone: "",
      displayCurrency: "",
      dateOfBirth: "",
      gender: "",
      language: "",
      timezoneOverride: "",
      parentPhone: "",
      avatarUrl: null,
    },
    snackbar: { open: false, message: "", severity: "success" },
  });
});

describe("StudentProfileContainer", () => {
  test("renders profile tab sections inside profile shell layout", async () => {
    renderWithWrapper(<StudentProfileContainerImpl />, {
      locale: "en",
      themeMode: "dark",
      mocks: createMocks(),
      viewport: "desktop",
    });

    await waitFor(() => {
      expect(screen.getByText(labels.personalInfo)).toBeInTheDocument();
    });

    expect(screen.getByText(labels.parentInfo)).toBeInTheDocument();
    expect(screen.getByText("Parent One")).toBeInTheDocument();
  });
});

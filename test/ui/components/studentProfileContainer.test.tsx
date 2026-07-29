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
  useSearchParams: () => new URLSearchParams("tab=profile"),
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

import { ProfileMode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { studentProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-profile.documents";
import { useStudentPortalProfileStore } from "@/frontend/common/stores/studentPortalProfileStore";
import { useStudentProfileViewModel } from "@/frontend/common/views/dashboard/student/profile/useStudentProfileViewModel";
import { StudentProfileDesktopView } from "@/frontend/desktop/views/dashboard/student/profile/studentProfile.desktop";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

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

const profileMockData = {
  studentProfile: {
    id: studentId,
    name: "Ahmed Student",
    status: "ACTIVE",
    avatarUrl: null,
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
    isAssociatedViewer: true,
    primaryTeacherId: "teacher-1",
    teacherUserId: "teacher-1",
    teacherName: "Ustadh Yusuf",
    hoursPerWeek: 4,
    classesRemaining: 12,
    classesTotal: 16,
    version: 1,
    createdAt: null,
    updatedAt: null,
    upcomingClasses: null,
    classHistory: null,
  },
};

function createMocks(): MockLink.MockedResponse[] {
  return [
    {
      request: {
        query: studentProfileQueryDocument,
        variables: { studentId: null, year: null, month: null },
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
      expect(screen.getByText("Personal Information")).toBeInTheDocument();
    });

    expect(screen.getByText("Parent Information")).toBeInTheDocument();
    expect(screen.getByText("Parent One")).toBeInTheDocument();
  });
});

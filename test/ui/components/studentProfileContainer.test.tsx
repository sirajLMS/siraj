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
  usePathname: () => "/students/me/profile",
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
  usePathname: () => "/students/me/profile",
  Link: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  redirect: () => {},
}));

mock.module("@/frontend/common/hooks/useLanguageSwitch", () => ({
  useLanguageSwitch: () => ({ currentLocale: "en", switchLanguage: () => {}, isPending: false }),
}));

import { afterEach, describe, expect, mock, test } from "bun:test";
import type { MockLink } from "@apollo/client/testing";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

expect.extend(matchers);

import { studentProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-profile.documents";
import { useStudentPortalProfileStore } from "@/frontend/common/stores/studentPortalProfileStore";
import { useStudentProfileViewModel } from "@/frontend/common/views/dashboard/student/profile/useStudentProfileViewModel";
import { StudentProfileDesktopView } from "@/frontend/desktop/views/dashboard/student/profile/studentProfile.desktop";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const studentId = "student-profile-1";

/**
 * Production-shaped desktop container for tests.
 * Bypasses ResponsiveViewSwitch / next/dynamic (not preloaded for this view).
 */
function StudentProfileContainerImpl() {
  const viewModel = useStudentProfileViewModel({});
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
      dateOfBirth: "",
      gender: "",
      language: "",
      parentPhone: "",
    },
    snackbar: { open: false, message: "", severity: "success" },
  });
});

describe("StudentProfileContainer", () => {
  test("renders profile header, edit button, and personal information", async () => {
    renderWithWrapper(<StudentProfileContainerImpl />, {
      locale: "en",
      themeMode: "dark",
      mocks: createMocks(),
      viewport: "desktop",
    });

    await waitFor(() => {
      expect(screen.getByText("My Profile")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Edit Profile" })).toBeInTheDocument();
    expect(screen.getByText("Personal Information")).toBeInTheDocument();
    expect(screen.getByText("Ahmed Student")).toBeInTheDocument();
    expect(screen.getByText("ahmed@example.com")).toBeInTheDocument();
  });

  test("enters edit mode and shows Save Changes", async () => {
    const user = userEvent.setup();

    renderWithWrapper(<StudentProfileContainerImpl />, {
      locale: "en",
      themeMode: "dark",
      mocks: createMocks(),
      viewport: "desktop",
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Edit Profile" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Edit Profile" }));

    expect(await screen.findByRole("button", { name: "Save Changes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });
});

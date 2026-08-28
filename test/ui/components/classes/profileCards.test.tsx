import { afterEach, describe, expect, mock, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

await mockNextNavigation("/classes", { locale: "ar", includeRouter: false });

await mock.module("next/link", () => ({
  default: ({
    children,
    href,
    prefetch: _prefetch,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    prefetch?: boolean;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";
import { StudentProfileCard } from "@/frontend/common/views/dashboard/classes/details/teacher/StudentProfileCard";
import { TeacherProfileCard } from "@/frontend/common/views/dashboard/classes/details/teacher/TeacherProfileCard";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

const locale: AppLocale = "ar";
const labels = readTranslation(Translation.Dashboard.ClassDetails, locale);
const profileLabels = { viewFullProfile: labels.studentProfile.viewFullProfile };

describe("StudentProfileCard", () => {
  test("renders the name without a profile link when the student id is missing", () => {
    renderWithWrapper(
      <StudentProfileCard
        student={{ id: null, name: "سارة أحمد", grade: null, level: null, avatarUrl: null }}
        labels={profileLabels}
      />,
      { locale }
    );

    expect(screen.getByText("سارة أحمد")).toBeInTheDocument();
    expect(screen.queryByText(profileLabels.viewFullProfile)).not.toBeInTheDocument();
  });

  test("renders the linked identity and view-profile button when the student id exists", () => {
    renderWithWrapper(
      <StudentProfileCard
        student={{ id: "student-1", name: "سارة أحمد", grade: null, level: null, avatarUrl: null }}
        labels={profileLabels}
      />,
      { locale }
    );

    const viewProfileLink = screen.getByRole("link", { name: profileLabels.viewFullProfile });
    expect(viewProfileLink).toHaveAttribute("id", "view-student-profile-btn");
    expect(viewProfileLink).toHaveAttribute("href", "/students/student-1/profile?tab=status");
  });
});

describe("TeacherProfileCard", () => {
  test("renders the name without a profile link when the teacher id is missing", () => {
    renderWithWrapper(
      <TeacherProfileCard
        teacher={{ id: null, name: "أحمد محمد", title: null, avatarUrl: null }}
        labels={profileLabels}
      />,
      { locale }
    );

    expect(screen.getByText("أحمد محمد")).toBeInTheDocument();
    expect(screen.queryByText(profileLabels.viewFullProfile)).not.toBeInTheDocument();
  });

  test("renders the linked identity and view-profile button when the teacher id exists", () => {
    renderWithWrapper(
      <TeacherProfileCard
        teacher={{ id: "teacher-1", name: "أحمد محمد", title: null, avatarUrl: null }}
        labels={profileLabels}
      />,
      { locale }
    );

    const viewProfileLink = screen.getByRole("link", { name: profileLabels.viewFullProfile });
    expect(viewProfileLink).toHaveAttribute("id", "view-teacher-profile-btn");
    expect(viewProfileLink).toHaveAttribute("href", "/teachers/teacher-1/profile");
  });
});

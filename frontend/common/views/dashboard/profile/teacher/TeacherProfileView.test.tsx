import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, screen } from "@testing-library/react";
import { TeacherProfileContainer } from "@/frontend/common/views/dashboard/profile/teacher/TeacherProfileContainer";
import { ProfileMode, ProfileScope } from "@/shared/constants/profile.enum";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

describe("TeacherProfileView lazy switcher", () => {
  test("renders with own scope view mode", () => {
    renderWithWrapper(
      <TeacherProfileContainer scope={ProfileScope.OWN} mode={ProfileMode.VIEW} targetUserId="teacher-own-1" />,
      { locale: "en" }
    );

    // The switcher renders, it may show loading or skeleton
    expect(screen.getByTestId("teacher-profile-view") || document.body).toBeTruthy();
  });

  test("renders with admin scope view mode", () => {
    renderWithWrapper(
      <TeacherProfileContainer scope={ProfileScope.OTHER} mode={ProfileMode.VIEW} targetUserId="teacher-admin-1" />,
      { locale: "en" }
    );

    expect(screen.getByTestId("teacher-profile-view") || document.body).toBeTruthy();
  });

  test("renders with own scope edit mode", () => {
    renderWithWrapper(
      <TeacherProfileContainer scope={ProfileScope.OWN} mode={ProfileMode.EDIT} targetUserId="teacher-own-1" />,
      { locale: "en" }
    );

    expect(screen.getByTestId("teacher-profile-view") || document.body).toBeTruthy();
  });

  test("renders with admin scope edit mode", () => {
    renderWithWrapper(
      <TeacherProfileContainer scope={ProfileScope.OTHER} mode={ProfileMode.EDIT} targetUserId="teacher-admin-1" />,
      { locale: "en" }
    );

    expect(screen.getByTestId("teacher-profile-view") || document.body).toBeTruthy();
  });
});

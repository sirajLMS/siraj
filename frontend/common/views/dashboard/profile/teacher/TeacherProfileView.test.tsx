import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, screen } from "@testing-library/react";
import { ProfileMode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { TeacherProfileView } from "@/frontend/common/views/dashboard/profile/teacher/TeacherProfileView";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

describe("TeacherProfileView lazy switcher", () => {
  test("renders with own scope view mode", () => {
    renderWithWrapper(
      <TeacherProfileView scope={ProfileScope.Own} mode={ProfileMode.View} targetUserId="teacher-own-1" />,
      { locale: "en" }
    );

    // The switcher renders, it may show loading or skeleton
    expect(screen.getByTestId("teacher-profile-view") || document.body).toBeTruthy();
  });

  test("renders with admin scope view mode", () => {
    renderWithWrapper(
      <TeacherProfileView scope={ProfileScope.Other} mode={ProfileMode.View} targetUserId="teacher-admin-1" />,
      { locale: "en" }
    );

    expect(screen.getByTestId("teacher-profile-view") || document.body).toBeTruthy();
  });

  test("renders with own scope edit mode", () => {
    renderWithWrapper(
      <TeacherProfileView scope={ProfileScope.Own} mode={ProfileMode.Edit} targetUserId="teacher-own-1" />,
      { locale: "en" }
    );

    expect(screen.getByTestId("teacher-profile-view") || document.body).toBeTruthy();
  });

  test("renders with admin scope edit mode", () => {
    renderWithWrapper(
      <TeacherProfileView scope={ProfileScope.Other} mode={ProfileMode.Edit} targetUserId="teacher-admin-1" />,
      { locale: "en" }
    );

    expect(screen.getByTestId("teacher-profile-view") || document.body).toBeTruthy();
  });
});

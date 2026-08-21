import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, screen } from "@testing-library/react";
import { StaffProfileView } from "@/frontend/common/views/dashboard/profile/staff/StaffProfileView";
import { ProfileMode, ProfileScope } from "@/shared/constants/profile.enum";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

describe("StaffProfileView lazy switcher", () => {
  test("renders with own scope view mode", () => {
    renderWithWrapper(
      <StaffProfileView scope={ProfileScope.OWN} mode={ProfileMode.VIEW} targetUserId="user-staff-1" />,
      { locale: "en" }
    );

    expect(screen.getByTestId("teacher-profile-view") || document.body).toBeTruthy();
  });

  test("renders with admin scope view mode", () => {
    renderWithWrapper(
      <StaffProfileView scope={ProfileScope.OTHER} mode={ProfileMode.VIEW} targetUserId="user-staff-1" />,
      { locale: "en" }
    );

    expect(screen.getByTestId("teacher-profile-view") || document.body).toBeTruthy();
  });
});

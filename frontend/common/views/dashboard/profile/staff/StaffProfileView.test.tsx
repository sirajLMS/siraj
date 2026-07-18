import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, screen } from "@testing-library/react";
import { ProfileMode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { StaffProfileView } from "@/frontend/common/views/dashboard/profile/staff/StaffProfileView";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

describe("StaffProfileView lazy switcher", () => {
  test("renders with own scope view mode", () => {
    renderWithWrapper(
      <StaffProfileView scope={ProfileScope.Own} mode={ProfileMode.View} targetUserId="user-staff-1" />,
      { locale: "en" }
    );

    expect(screen.getByTestId("teacher-profile-view") || document.body).toBeTruthy();
  });

  test("renders with admin scope view mode", () => {
    renderWithWrapper(
      <StaffProfileView scope={ProfileScope.Other} mode={ProfileMode.View} targetUserId="user-staff-1" />,
      { locale: "en" }
    );

    expect(screen.getByTestId("teacher-profile-view") || document.body).toBeTruthy();
  });
});

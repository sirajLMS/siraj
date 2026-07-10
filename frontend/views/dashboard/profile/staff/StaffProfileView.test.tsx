import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, screen } from "@testing-library/react";
import { AccountStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import { StaffProfileView } from "@/frontend/views/dashboard/profile/staff/StaffProfileView";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const staffProfile = {
  id: "user-staff-1",
  staffProfileId: "staff-profile-1",
  name: "Robert Staff",
  email: "robert.s@educore.edu",
  avatarUrl: null,
  phone: "+1 (555) 123-4567",
  status: AccountStatus.Activated,
  roleSlug: "senior-admin",
  roleName: "Senior Administrator",
};

afterEach(() => {
  cleanup();
});

describe("StaffProfileView", () => {
  test("shows contact information for own scope", () => {
    renderWithWrapper(<StaffProfileView staffData={staffProfile} isAdminScope={false} />, { locale: "en" });

    expect(screen.getByText("Contact Information")).toBeTruthy();
    expect(screen.getByText("+1 (555) 123-4567")).toBeTruthy();
    expect(screen.queryByText("Role Information")).toBeNull();
    expect(screen.queryByText("Effective Permissions")).toBeNull();
  });

  test("shows admin banner and account status for admin scope", () => {
    renderWithWrapper(<StaffProfileView staffData={staffProfile} isAdminScope={true} />, { locale: "en" });

    expect(screen.getByText("Administrative view: status and permissions are visible.")).toBeTruthy();
    expect(screen.getByText("Account Information")).toBeTruthy();
    expect(screen.getByText("Active")).toBeTruthy();
  });
});

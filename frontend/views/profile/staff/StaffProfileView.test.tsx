import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, screen } from "@testing-library/react";
import { AccountStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";
import { StaffProfileView } from "./StaffProfileView";

const staffProfile = {
  id: "user-staff-1",
  staffProfileId: "staff-profile-1",
  name: "Robert Staff",
  email: "robert.s@educore.edu",
  avatarUrl: null,
  phone: "+1 (555) 123-4567",
  skypeId: "live:robert.staff_edu",
  status: AccountStatus.Activated,
  roleSlug: "senior-admin",
  roleName: "Senior Administrator",
};

const permissionGroups = [
  {
    id: "group-1",
    name: "User Management",
    slug: "user-management",
    description: null,
  },
];

afterEach(() => {
  cleanup();
});

describe("StaffProfileView permissions", () => {
  test("hides permissions section for own scope", () => {
    renderWithWrapper(
      <StaffProfileView
        staffData={staffProfile}
        isAdminScope={false}
        permissionGroups={permissionGroups}
        permissionOverrides={[]}
      />,
      { locale: "en" }
    );

    expect(screen.queryByText("Inherited Permission Groups")).toBeNull();
    expect(screen.queryByText("No permission groups assigned")).toBeNull();
  });

  test("shows permissions section for admin scope", () => {
    renderWithWrapper(
      <StaffProfileView
        staffData={staffProfile}
        isAdminScope={true}
        permissionGroups={permissionGroups}
        permissionOverrides={[]}
      />,
      { locale: "en" }
    );

    expect(screen.getByText("Inherited Permission Groups")).toBeTruthy();
    expect(screen.getByText("User Management")).toBeTruthy();
  });
});

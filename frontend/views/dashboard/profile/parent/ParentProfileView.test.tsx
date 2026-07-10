import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, screen } from "@testing-library/react";
import { CurrencyCode, IanaTimezone } from "@/frontend/graphql/generated/gql/graphql-types";
import { ParentProfileView } from "@/frontend/views/dashboard/profile/parent/ParentProfileView";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const parentOwnProfile = {
  id: "parent-own-1",
  name: "Noor Abdullah",
  email: "noor.abdullah@example.com",
  phone: "+966 50 123 4567",
  facebook: "facebook.com/noor",
  whatsapp: "+966501234567",
  twitter: "@noor",
};

const parentAdminProfile = {
  id: "parent-admin-1",
  userId: "user-parent-1",
  name: "Noor Abdullah",
  email: "noor.abdullah@example.com",
  avatarUrl: null,
  status: "REGULAR",
  phone: "+966 50 123 4567",
  nationality: "SA",
  address: "123 King Fahd Rd, Riyadh",
  facebook: "facebook.com/noor",
  whatsapp: "+966501234567",
  twitter: "@noor",
  invoiceType: "Monthly",
  feeAmount: "500",
  paymentMethod: "Bank Transfer",
  currency: CurrencyCode.Sar,
  timezone: IanaTimezone.AsiaRiyadh,
  createdAt: "2024-01-15T00:00:00.000Z",
  updatedAt: "2024-06-01T00:00:00.000Z",
};

const associatedStudents = {
  id: "associated-students-1",
  totalCount: 1,
  rows: [
    {
      id: "student-1",
      name: "Adam Noor",
      studentAvatarUrl: null,
      status: "REGULAR",
      primaryTeacherId: "teacher-1",
      teacherUserId: "user-teacher-1",
      teacherName: "Ahmed Hassan",
      teacherAvatarUrl: null,
      hoursPerWeek: "3",
      classesRemaining: 14,
      classesTotal: 20,
    },
  ],
};

afterEach(() => {
  cleanup();
});

describe("ParentProfileView admin sections", () => {
  test("hides identity and billing sections for own scope", () => {
    renderWithWrapper(
      <ParentProfileView
        parentData={parentOwnProfile}
        associatedStudents={associatedStudents}
        displayCurrency={null}
        isAdminScope={false}
      />,
      { locale: "en" }
    );

    expect(screen.queryByText("Identity")).toBeNull();
    expect(screen.queryByText("Billing")).toBeNull();
    expect(screen.getByText("Associated Students")).toBeTruthy();
  });

  test("shows identity and billing sections for admin scope", () => {
    renderWithWrapper(
      <ParentProfileView
        parentData={parentAdminProfile}
        associatedStudents={associatedStudents}
        displayCurrency={CurrencyCode.Sar}
        isAdminScope={true}
      />,
      { locale: "en" }
    );

    expect(screen.getByText("Administrative view: identity and billing fields are visible.")).toBeTruthy();
    expect(screen.getByText("Identity")).toBeTruthy();
    expect(screen.getByText("Billing")).toBeTruthy();
    expect(screen.getByText("Nationality")).toBeTruthy();
  });
});

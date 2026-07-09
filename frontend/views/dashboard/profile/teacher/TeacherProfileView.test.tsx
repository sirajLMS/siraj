import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, screen } from "@testing-library/react";
import { AccountStatus, Gender, IanaTimezone, PaymentMethod } from "@/frontend/graphql/generated/gql/graphql-types";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";
import type { TeacherAdminData, TeacherOwnData } from "./sections/teacherProfileTypes";
import { TeacherProfileView } from "./TeacherProfileView";

const teacherOwnProfile: TeacherOwnData = {
  id: "teacher-own-1",
  name: "Ahmed Hassan",
  email: "ahmed.hassan@example.com",
  phone: "+966 50 123 4567",
  timezone: IanaTimezone.AsiaRiyadh,
  hourlyRate: "45.00",
  rateCurrency: "USD",
  paymentMethod: PaymentMethod.Paypal,
  zoomLink: "https://zoom.us/j/teacher123",
  totalClasses: 42,
};

const teacherAdminProfile: TeacherAdminData = {
  id: "teacher-admin-1",
  name: "Ahmed Hassan",
  email: "ahmed.hassan@example.com",
  phone: "+966 50 123 4567",
  nationalId: "****6789",
  dateOfBirth: "1990-05-15T00:00:00.000Z",
  gender: Gender.Male,
  address: "123 King Fahd Rd, Riyadh",
  qualifications: "Bachelor of Islamic Studies",
  zoomLink: "https://zoom.us/j/teacher123",
  zoomUsername: "ahmed.teacher",
  hasZoomPassword: true,
  timezone: IanaTimezone.AsiaRiyadh,
  hourlyRate: "45.00",
  rateCurrency: "USD",
  status: AccountStatus.Activated,
  updatedAt: "2024-06-01T00:00:00.000Z",
  paymentMethod: PaymentMethod.Paypal,
  totalClasses: 42,
  avgEngagementScore: 4.2,
};

afterEach(() => {
  cleanup();
});

describe("TeacherProfileView admin sections", () => {
  test("hides AdminOnlySection for own scope", () => {
    renderWithWrapper(<TeacherProfileView teacherData={teacherOwnProfile} isAdminScope={false} />, { locale: "en" });

    expect(screen.queryByText("Administrative Details")).toBeNull();
    expect(screen.queryByText("National ID")).toBeNull();
    expect(screen.getByText("Total Classes")).toBeTruthy();
  });

  test("shows AdminOnlySection for admin scope", () => {
    renderWithWrapper(<TeacherProfileView teacherData={teacherAdminProfile} isAdminScope={true} />, { locale: "en" });

    expect(screen.getByText("Administrative Details")).toBeTruthy();
    expect(screen.getByText("National ID")).toBeTruthy();
    expect(screen.getByText("Avg Engagement")).toBeTruthy();
  });
});

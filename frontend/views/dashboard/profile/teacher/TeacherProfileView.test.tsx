import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, screen } from "@testing-library/react";
import { AccountStatus, CurrencyCode, Gender, IanaTimezone } from "@/frontend/graphql/generated/gql/graphql-types";
import type {
  TeacherAdminData,
  TeacherOwnData,
} from "@/frontend/views/dashboard/profile/teacher/sections/teacherProfileTypes";
import { TeacherProfileView } from "@/frontend/views/dashboard/profile/teacher/TeacherProfileView";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const teacherOwnProfile: TeacherOwnData = {
  id: "teacher-own-1",
  name: "Ahmed Hassan",
  email: "ahmed.hassan@example.com",
  phone: "+966 50 123 4567",
  timezone: IanaTimezone.AsiaRiyadh,
  hourlyRate: "45.00",
  rateCurrency: CurrencyCode.Usd,
  totalClasses: 42,
  displayAmount: null,
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
  timezone: IanaTimezone.AsiaRiyadh,
  hourlyRate: "45.00",
  rateCurrency: CurrencyCode.Usd,
  status: AccountStatus.Activated,
  updatedAt: "2024-06-01T00:00:00.000Z",
  totalClasses: 42,
  avgEngagementScore: 4.2,
  displayAmount: null,
};

afterEach(() => {
  cleanup();
});

describe("TeacherProfileView admin sections", () => {
  test("hides AdminOnlySection for own scope", () => {
    renderWithWrapper(
      <TeacherProfileView teacherData={teacherOwnProfile} displayCurrency={null} isAdminScope={false} />,
      { locale: "en" }
    );

    expect(screen.queryByText("Administrative Details")).toBeNull();
    expect(screen.queryByText("National ID")).toBeNull();
    expect(screen.getByText("Total Classes")).toBeTruthy();
  });

  test("shows AdminOnlySection for admin scope", () => {
    renderWithWrapper(
      <TeacherProfileView teacherData={teacherAdminProfile} displayCurrency={CurrencyCode.Usd} isAdminScope={true} />,
      { locale: "en" }
    );

    expect(screen.getByText("Administrative Details")).toBeTruthy();
    expect(screen.getByText("National ID")).toBeTruthy();
    expect(screen.getByText("Avg Engagement")).toBeTruthy();
  });
});

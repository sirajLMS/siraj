import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, screen } from "@testing-library/react";
import {
  CurrencyCode,
  IanaTimezone,
  ProfileMode,
  ProfileScope,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ParentProfileView } from "@/frontend/common/views/dashboard/profile/parent/ParentProfileView";
import type { ParentAdminEditFormData } from "@/frontend/common/views/dashboard/profile/parent/parentProfileFormTypes";
import type {
  AssociatedStudents,
  ParentAdminData,
  ParentOwnData,
  ParentViewData,
} from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const parentOwnProfile = {
  id: "parent-own-1",
  name: "Noor Abdullah",
  email: "noor.abdullah@example.com",
  phone: "+966 50 123 4567",
  facebook: "facebook.com/noor",
  whatsapp: "+966501234567",
  twitter: "@noor",
} as unknown as ParentOwnData;

const parentAdminProfile = {
  id: "parent-admin-1",
  userId: "user-parent-1",
  name: "Noor Abdullah",
  email: "noor.abdullah@example.com",
  avatarUrl: null,
  lifecycleStatus: "REGULAR",
  accountStatus: "ACTIVATED",
  phone: "+966 50 123 4567",
  nationality: "SA",
  address: "123 King Fahd Rd, Riyadh",
  facebook: "facebook.com/noor",
  whatsapp: "+966501234567",
  twitter: "@noor",
  invoiceType: "Monthly",
  feeAmount: "500",
  currency: CurrencyCode.Sar,
  displayAmount: null,
  timezone: IanaTimezone.AsiaRiyadh,
  createdAt: "2024-01-15T00:00:00.000Z",
  updatedAt: "2024-06-01T00:00:00.000Z",
} as unknown as ParentAdminData;

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
} as unknown as AssociatedStudents;

const baseEditData = {
  name: "Noor Abdullah",
  email: "noor.abdullah@example.com",
  displayCurrency: null,
  phone: "+966 50 123 4567",
  facebook: "facebook.com/noor",
  whatsapp: "+966501234567",
  twitter: "@noor",
  nationality: "SA",
  address: "123 King Fahd Rd, Riyadh",
  invoiceType: "Monthly",
  feeAmount: "500",
  currency: CurrencyCode.Sar,
  timezone: IanaTimezone.AsiaRiyadh,
  lifecycleStatus: "REGULAR",
} as unknown as ParentAdminEditFormData;

const noop = async () => {};
const noopVoid = () => {};
const allowAll = () => true;

afterEach(() => {
  cleanup();
});

describe("ParentProfileView admin sections", () => {
  test("hides identity and billing sections for own scope", () => {
    renderWithWrapper(
      <ParentProfileView
        scope={ProfileScope.Own}
        mode={ProfileMode.View}
        targetUserId="user-self-1"
        activeTab="profile"
        isAdminScope={false}
        loading={false}
        error={null}
        isSaving={false}
        onSubmit={noop as (formData: ParentAdminEditFormData) => Promise<void>}
        onRetry={noopVoid}
        parentData={parentOwnProfile as ParentViewData}
        editData={baseEditData}
        avatarUrl={null}
        displayCurrency={null}
        parentId="parent-own-1"
        meetingTabHref="?tab=meeting"
        associatedStudents={associatedStudents}
        canView={allowAll}
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
        scope={ProfileScope.Other}
        mode={ProfileMode.View}
        targetUserId="user-parent-1"
        activeTab="profile"
        isAdminScope={true}
        loading={false}
        error={null}
        isSaving={false}
        onSubmit={noop as (formData: ParentAdminEditFormData) => Promise<void>}
        onRetry={noopVoid}
        parentData={parentAdminProfile as ParentViewData}
        editData={baseEditData}
        avatarUrl={null}
        displayCurrency={CurrencyCode.Sar}
        parentId="parent-admin-1"
        meetingTabHref="?tab=meeting"
        associatedStudents={associatedStudents}
        canView={allowAll}
      />,
      { locale: "en" }
    );

    expect(screen.getByText("Administrative view: identity and billing fields are visible.")).toBeTruthy();
    expect(screen.getByText("Identity")).toBeTruthy();
    expect(screen.getByText("Billing")).toBeTruthy();
    expect(screen.getByText("Nationality")).toBeTruthy();
  });
});

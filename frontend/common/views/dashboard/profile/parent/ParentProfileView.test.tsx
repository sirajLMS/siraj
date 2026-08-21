import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, screen } from "@testing-library/react";
import {
  AccountStatus,
  CurrencyCode,
  ParentStatus,
  StudentStatus,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { ParentProfileView } from "@/frontend/common/views/dashboard/profile/parent/ParentProfileView";
import type { ParentAdminEditFormData } from "@/frontend/common/views/dashboard/profile/parent/parentProfileFormTypes";
import type {
  AssociatedStudents,
  ParentAdminData,
  ParentOwnData,
} from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import { ProfileMode, ProfileScope } from "@/shared/constants/profile.enum";
import { profileBaseEn } from "@/shared/locale/en/profile/base";
import { profileParentEn } from "@/shared/locale/en/profile/parent";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const mockParentProfileLabels = {
  base: profileBaseEn,
  parent: profileParentEn,
} as const;

const parentOwnProfile: ParentOwnData = {
  id: "parent-own-1",
  name: "Noor Abdullah",
  email: "noor.abdullah@example.com",
  phone: "+966 50 123 4567",
  facebook: "facebook.com/noor",
  whatsapp: "+966501234567",
  twitter: "@noor",
  nationality: "SA",
  address: "123 King Fahd Rd, Riyadh",
};

const parentAdminProfile: ParentAdminData = {
  id: "parent-admin-1",
  userId: "user-parent-1",
  name: "Noor Abdullah",
  email: "noor.abdullah@example.com",
  avatarUrl: null,
  lifecycleStatus: ParentStatus.Regular,
  accountStatus: AccountStatus.Activated,
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
  timezone: IanaTimezone.Asia_Riyadh,
  createdAt: "2024-01-15T00:00:00.000Z",
  updatedAt: "2024-06-01T00:00:00.000Z",
};

const associatedStudents: AssociatedStudents = {
  id: "associated-students-1",
  totalCount: 1,
  rows: [
    {
      id: "student-1",
      name: "Adam Noor",
      studentAvatarUrl: null,
      status: StudentStatus.Regular,
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

const baseEditData: ParentAdminEditFormData = {
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
  timezone: IanaTimezone.Asia_Riyadh,
  lifecycleStatus: ParentStatus.Regular,
};

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
        labels={mockParentProfileLabels}
        scope={ProfileScope.OWN}
        mode={ProfileMode.VIEW}
        targetUserId="user-self-1"
        activeTab="profile"
        isAdminScope={false}
        loading={false}
        error={null}
        isSaving={false}
        onSubmit={noop}
        onRetry={noopVoid}
        parentData={parentOwnProfile}
        editData={baseEditData}
        avatarUrl={null}
        displayCurrency={null}
        profileTimezone={null}
        profilePhone={null}
        parentId="parent-own-1"
        meetingTabHref="?tab=meeting"
        associatedStudents={associatedStudents}
        canView={allowAll}
      />,
      { locale: "en" }
    );

    expect(screen.queryByText("Identity")).toBeNull();
    expect(screen.queryByText("Billing")).toBeNull();
    expect(screen.getByText("Associated Students")).toBeInTheDocument();
  });

  test("shows identity and billing sections for admin scope", () => {
    renderWithWrapper(
      <ParentProfileView
        labels={mockParentProfileLabels}
        scope={ProfileScope.OTHER}
        mode={ProfileMode.VIEW}
        targetUserId="user-parent-1"
        activeTab="profile"
        isAdminScope={true}
        loading={false}
        error={null}
        isSaving={false}
        onSubmit={noop}
        onRetry={noopVoid}
        parentData={parentAdminProfile}
        editData={baseEditData}
        avatarUrl={null}
        displayCurrency={CurrencyCode.Sar}
        profileTimezone={IanaTimezone.Asia_Riyadh}
        profilePhone="+966500000000"
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

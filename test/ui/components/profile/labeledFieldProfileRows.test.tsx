import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import { AccountStatus, CurrencyCode, ParentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { BillingSection } from "@/frontend/common/views/dashboard/profile/parent/sections/BillingSection";
import type { ParentAdminData } from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { RoleSection } from "@/frontend/common/views/dashboard/profile/staff/sections/RoleSection";
import type { StaffProfileData } from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

const locale: AppLocale = "ar";

const baseLabels = readTranslation(Translation.Profile.Base, locale);
const staffLabels = readTranslation(Translation.Profile.Staff, locale);
const parentLabels = readTranslation(Translation.Profile.Parent, locale);
const errorLabels = readTranslation(Translation.Errors, locale);

const STAFF_DATA: StaffProfileData = {
  id: "staff-1",
  userId: "staff-user-1",
  staffProfileId: "staff-1",
  name: "Ahmed Test",
  email: "[EMAIL_REDACTED]",
  avatarUrl: null,
  phone: null,
  status: AccountStatus.Activated,
  roleSlug: "manager",
  roleName: "Manager",
  hourlyRate: null,
  rateCurrency: null,
  displayAmount: null,
};

const PARENT_ADMIN_DATA: ParentAdminData = {
  id: "parent-1",
  userId: "parent-user-1",
  name: "Parent Test",
  email: "[EMAIL_REDACTED]",
  avatarUrl: null,
  lifecycleStatus: ParentStatus.Regular,
  accountStatus: AccountStatus.Activated,
  phone: null,
  nationality: null,
  address: null,
  facebook: null,
  whatsapp: null,
  twitter: null,
  invoiceType: "perClass",
  feeAmount: "100",
  currency: CurrencyCode.Sar,
  timezone: null,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  displayAmount: null,
};

describe("profile label/value rows via LabeledField", () => {
  test("staff RoleSection renders the role name as a label/value pair", () => {
    renderWithWrapper(
      <RoleSection staffData={STAFF_DATA} labels={{ staff: staffLabels, base: { notSet: baseLabels.notSet } }} />,
      { locale }
    );
    const label = screen.getByText(staffLabels.fields.roleName);
    const value = screen.getByText("Manager");
    expect(label).toBeInTheDocument();
    expect(value).toBeInTheDocument();
    expect(label.parentElement).toBe(value.parentElement);
  });

  test("parent BillingSection renders invoice and currency rows", () => {
    renderWithWrapper(
      <BillingSection
        mode="view"
        labels={{
          parent: parentLabels,
          base: { notSet: baseLabels.notSet, convertedTotalApprox: baseLabels.convertedTotalApprox },
          errors: errorLabels,
        }}
        adminData={PARENT_ADMIN_DATA}
      />,
      { locale }
    );
    expect(screen.getByText(parentLabels.fields.invoiceType)).toBeInTheDocument();
    expect(screen.getByText("perClass")).toBeInTheDocument();
    expect(screen.getByText(parentLabels.fields.currency)).toBeInTheDocument();
    expect(screen.getByText(parentLabels.fields.feeAmount)).toBeInTheDocument();
  });
});

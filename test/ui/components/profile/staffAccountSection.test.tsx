import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { MockLink } from "@apollo/client/testing";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen } from "@testing-library/react";

expect.extend(matchers);

import { AccountStatus, AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { AccountSection } from "@/frontend/common/views/dashboard/profile/staff/sections/AccountSection";
import {
  type StaffProfileData,
  toStaffSharedBaseLabels,
} from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
import { ProfileScope } from "@/shared/constants/profile.enum";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import {
  ADMIN_RESET_TEST_PASSWORD,
  buildAdminResetPasswordMock,
  seedUserPermissions,
  waitForDialogClosed,
} from "@/test/ui/components/helpers/resetPasswordDialogHelpers";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

beforeEach(() => {
  seedUserPermissions([]);
});

afterEach(() => {
  cleanup();
});

const locale: AppLocale = "ar";

const baseLabels = readTranslation(Translation.Profile.Base, locale);
const staffLabels = readTranslation(Translation.Profile.Staff, locale);

const TARGET_USER_ID = "staff-user-1";
const NEW_PASSWORD = ADMIN_RESET_TEST_PASSWORD;
const RESET_TITLE = baseLabels.adminResetPassword.title;

const STAFF_DATA: StaffProfileData = {
  id: "staff-1",
  userId: TARGET_USER_ID,
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

const VIEW_PERMISSIONS = [AppPermission.ProfileCoreIdentityViewOther, AppPermission.ProfileStaffRoleViewOther];

const ADMIN_PERMISSIONS = [...VIEW_PERMISSIONS, AppPermission.UserAdminResetPassword];

function renderAccountSection(permissions: AppPermission[], mocks: MockLink.MockedResponse[] = []) {
  seedUserPermissions(permissions);
  return renderWithWrapper(
    <AccountSection
      mode="view"
      labels={{ staff: staffLabels, baseLabels: toStaffSharedBaseLabels(baseLabels) }}
      scope={ProfileScope.OTHER}
      staffData={STAFF_DATA}
      isAdminScope
      displayCurrency={null}
      targetUserId={TARGET_USER_ID}
    />,
    { locale, permissions, mocks }
  );
}

async function openResetDialog(): Promise<void> {
  const keyButton = await screen.findByRole("button", { name: RESET_TITLE });
  fireEvent.click(keyButton);
}

async function submitResetPasswordForm(): Promise<void> {
  fireEvent.change(screen.getByLabelText(baseLabels.adminResetPassword.newPassword), {
    target: { value: NEW_PASSWORD },
  });
  fireEvent.change(screen.getByLabelText(baseLabels.adminResetPassword.confirmPassword), {
    target: { value: NEW_PASSWORD },
  });
  fireEvent.click(screen.getByRole("button", { name: baseLabels.adminResetPassword.resetButton }));
}

describe("staff AccountSection (view)", () => {
  test("renders the role status as a LabeledField row with a status badge", async () => {
    renderAccountSection(ADMIN_PERMISSIONS);
    expect(await screen.findByText(staffLabels.fields.status)).toBeInTheDocument();
    expect(screen.getByText(staffLabels.fields.statusActive)).toBeInTheDocument();
  });

  test("renders the reset-password key button under the admin-reset label", async () => {
    renderAccountSection(ADMIN_PERMISSIONS);
    expect(await screen.findByRole("button", { name: RESET_TITLE })).toBeInTheDocument();
  });

  test("opens exactly one ResetPasswordDialog from the key button", async () => {
    renderAccountSection(ADMIN_PERMISSIONS);
    await openResetDialog();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });

  test("confirm invokes the adminResetPassword mutation for the target user and closes the dialog on success", async () => {
    renderAccountSection(ADMIN_PERMISSIONS, [buildAdminResetPasswordMock(TARGET_USER_ID, NEW_PASSWORD)]);
    await openResetDialog();
    await submitResetPasswordForm();

    await waitForDialogClosed();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("hides the reset button and dialog when the admin-reset permission is missing", async () => {
    renderAccountSection(VIEW_PERMISSIONS);
    expect(await screen.findByText(staffLabels.fields.statusActive)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: RESET_TITLE })).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

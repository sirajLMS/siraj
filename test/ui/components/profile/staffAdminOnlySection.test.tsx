import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { MockLink } from "@apollo/client/testing";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen } from "@testing-library/react";

expect.extend(matchers);

import { AccountStatus, AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { AdminOnlySection } from "@/frontend/common/views/dashboard/profile/staff/sections/AdminOnlySection";
import { toStaffSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
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

const TARGET_USER_ID = "staff-user-2";
const NEW_PASSWORD = ADMIN_RESET_TEST_PASSWORD;
const RESET_TITLE = baseLabels.adminResetPassword.title;

const STAFF_PROFILE = {
  userId: TARGET_USER_ID,
  name: "Ahmed Test",
  email: "[EMAIL_REDACTED]",
  status: AccountStatus.Activated,
};

const ADMIN_PERMISSIONS = [AppPermission.UserAdminResetPassword];

function renderAdminOnlySection(permissions: AppPermission[], mocks: MockLink.MockedResponse[] = []) {
  seedUserPermissions(permissions);
  return renderWithWrapper(
    <AdminOnlySection
      mode="view"
      labels={{ staff: staffLabels, baseLabels: toStaffSharedBaseLabels(baseLabels) }}
      profile={STAFF_PROFILE}
    />,
    { locale, permissions, mocks }
  );
}

describe("staff AdminOnlySection (view)", () => {
  test("renders the role section with the status badge via AdminSectionShared", async () => {
    renderAdminOnlySection(ADMIN_PERMISSIONS);
    expect(await screen.findByText(staffLabels.sections.role)).toBeInTheDocument();
    expect(screen.getByText(staffLabels.fields.statusActive)).toBeInTheDocument();
  });

  test("opens exactly one ResetPasswordDialog from the key button", async () => {
    renderAdminOnlySection(ADMIN_PERMISSIONS);
    const keyButton = await screen.findByRole("button", { name: RESET_TITLE });
    fireEvent.click(keyButton);
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });

  test("confirm invokes the adminResetPassword mutation for the target user and closes the dialog on success", async () => {
    renderAdminOnlySection(ADMIN_PERMISSIONS, [buildAdminResetPasswordMock(TARGET_USER_ID, NEW_PASSWORD)]);
    const keyButton = await screen.findByRole("button", { name: RESET_TITLE });
    fireEvent.click(keyButton);

    fireEvent.change(screen.getByLabelText(baseLabels.adminResetPassword.newPassword), {
      target: { value: NEW_PASSWORD },
    });
    fireEvent.change(screen.getByLabelText(baseLabels.adminResetPassword.confirmPassword), {
      target: { value: NEW_PASSWORD },
    });
    fireEvent.click(screen.getByRole("button", { name: baseLabels.adminResetPassword.resetButton }));

    await waitForDialogClosed();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("renders no reset affordance when the admin-reset permission is missing", async () => {
    renderAdminOnlySection([]);
    expect(await screen.findByText(staffLabels.fields.statusActive)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: RESET_TITLE })).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

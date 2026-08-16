import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { act, cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  validateAccessToken,
  validateDisplayName,
  validatePhoneNumberId,
  validateTwoStepPin,
  validateWabaId,
} from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappFormValidation";
import { NumbersTabDesktop } from "@/frontend/desktop/views/dashboard/settings/whatsapp/tabs/NumbersTab.desktop";
import {
  firstCallArgString,
  makeAccountRow,
  testSettingsLabels,
} from "@/test/ui/components/helpers/whatsappTestHelpers";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const noopPromise = (): Promise<void> => Promise.resolve();

const baseProps = {
  labels: testSettingsLabels,
  accounts: [],
  loading: false,
  syncing: false,
  snackbar: null,
  deletingId: null,
  syncingId: null,
  editingTokenForId: null,
  editingPinForId: null,
  isConfigured: true,
  creating: false,
  updatingId: null,
  mutationError: null,
  onSyncFromMeta: mock(noopPromise),
  onDismissSnackbar: mock(() => {}),
  onOpenDeleteConfirmDialog: mock(() => {}),
  onDeleteAccount: mock(noopPromise),
  onSetAccessToken: mock(noopPromise),
  onSetTwoStepPin: mock(noopPromise),
  onOpenCreateDialog: mock(() => {}),
  onOpenEditNameDialog: mock(() => {}),
  onCloseDialog: mock(() => {}),
  onCreate: mock(noopPromise),
  onEditName: mock(noopPromise),
  validateDisplayName,
  validatePhoneNumberId,
  validateWabaId,
  validateAccessToken,
  validateTwoStepPin,
};

function renderDesktopWithAccount(overrides: Record<string, unknown> = {}) {
  const onSetAccessToken = mock(noopPromise);
  const onSetTwoStepPin = mock(noopPromise);
  const account = makeAccountRow("acc-1", "+555", "Test Account");
  renderWithWrapper(
    <NumbersTabDesktop
      {...baseProps}
      accounts={[account]}
      dialogState={{ type: null }}
      onSetAccessToken={onSetAccessToken}
      onSetTwoStepPin={onSetTwoStepPin}
      {...overrides}
    />,
    { locale: "en", permissions: [AppPermission.WhatsappConfigManage] }
  );
  return { onSetAccessToken, onSetTwoStepPin, account };
}

async function openActionMenu() {
  const menuBtn = screen.getByLabelText(testSettingsLabels.page.editAccount);
  await act(async () => {
    fireEvent.click(menuBtn);
  });
}

async function clickMenuItem(label: string) {
  await act(async () => {
    fireEvent.click(screen.getByText(label));
  });
}

async function fillAndSave(placeholder: string, value: string) {
  const input = screen.getByPlaceholderText(placeholder);
  await act(async () => {
    fireEvent.change(input, { target: { value } });
  });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: testSettingsLabels.page.save }));
  });
}

function expectSaveDisabled() {
  const saveBtn = screen.getByRole("button", { name: testSettingsLabels.page.save });
  expect(saveBtn.hasAttribute("disabled")).toBe(true);
}

async function openDialogAndExpect(menuItemLabel: string) {
  await openActionMenu();
  await clickMenuItem(menuItemLabel);
  await waitFor(() => {
    expect(screen.getByText(menuItemLabel)).toBeTruthy();
  });
  expectSaveDisabled();
}

async function submitCredentialDialog(
  menuItemLabel: string,
  placeholder: string,
  value: string,
  mockFn: { mock: { calls: readonly unknown[][] } } & ((...args: unknown[]) => unknown)
) {
  await openActionMenu();
  await clickMenuItem(menuItemLabel);
  await fillAndSave(placeholder, value);
  await waitFor(() => {
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(firstCallArgString(mockFn)).toBe("acc-1");
  });
}

describe("CredentialEditDialog (via NumbersTabDesktop action menu)", () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  test("edit token dialog: click menu Edit Token opens dialog with title and disabled Save", async () => {
    renderDesktopWithAccount();
    await openDialogAndExpect(testSettingsLabels.page.editToken);
  });

  test("edit token dialog: typing a value enables Save and clicking Save calls onSetAccessToken", async () => {
    const { onSetAccessToken } = renderDesktopWithAccount();
    await submitCredentialDialog(
      testSettingsLabels.page.editToken,
      testSettingsLabels.page.accessTokenPlaceholder,
      "a".repeat(50),
      onSetAccessToken
    );
  });

  test("edit pin dialog: click menu Edit Pin opens dialog with title and disabled Save", async () => {
    renderDesktopWithAccount();
    await openDialogAndExpect(testSettingsLabels.page.editPin);
  });

  test("edit pin dialog: typing a value and clicking Save calls onSetTwoStepPin", async () => {
    const { onSetTwoStepPin } = renderDesktopWithAccount();
    await submitCredentialDialog(
      testSettingsLabels.page.editPin,
      testSettingsLabels.page.twoStepPinPlaceholder,
      "123456",
      onSetTwoStepPin
    );
  });

  test("credential dialog Cancel button closes dialog without calling set handler", async () => {
    const { onSetAccessToken } = renderDesktopWithAccount();
    await openActionMenu();
    await act(async () => {
      fireEvent.click(screen.getByText(testSettingsLabels.page.editToken));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: testSettingsLabels.page.cancel }));
    });
    expect(onSetAccessToken).toHaveBeenCalledTimes(0);
  });
});

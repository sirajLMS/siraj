import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { act, cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { WhatsappSettingsLabels } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import {
  validateAccessToken,
  validateDisplayName,
  validatePhoneNumberId,
  validateTwoStepPin,
  validateWabaId,
} from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappFormValidation";
import { NumbersTabDesktop } from "@/frontend/desktop/views/dashboard/settings/whatsapp/tabs/NumbersTab.desktop";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { firstCallArgString, makeAccountRow } from "@/test/ui/components/helpers/whatsappTestHelpers";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const noopPromise = (): Promise<void> => Promise.resolve();

const locale: AppLocale = "ar";
const labels = readTranslation(Translation.Whatsapp, locale);

const settingsLabels: WhatsappSettingsLabels = {
  page: labels,
  notifications: {
    syncSuccess: labels.syncSuccess,
    syncNoChange: labels.syncNoChange,
    syncError: labels.syncError,
    deleteSuccess: labels.deleteSuccess,
    deleteError: labels.deleteError,
    saveSuccess: labels.saveSuccess,
    saveError: labels.saveError,
    optInSuccess: "Opt-in updated successfully.",
    optInError: labels.optInError,
  },
};

const baseProps = {
  labels: settingsLabels,
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
    { locale, permissions: [AppPermission.WhatsappConfigManage] }
  );
  return { onSetAccessToken, onSetTwoStepPin, account };
}

async function openActionMenu() {
  const menuBtn = screen.getByLabelText(labels.editAccount);
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
    fireEvent.click(screen.getByRole("button", { name: labels.save }));
  });
}

function expectSaveDisabled() {
  const saveBtn = screen.getByRole("button", { name: labels.save });
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
    await openDialogAndExpect(labels.editToken);
  });

  test("edit token dialog: typing a value enables Save and clicking Save calls onSetAccessToken", async () => {
    const { onSetAccessToken } = renderDesktopWithAccount();
    await submitCredentialDialog(labels.editToken, labels.accessTokenPlaceholder, "a".repeat(50), onSetAccessToken);
  });

  test("edit pin dialog: click menu Edit Pin opens dialog with title and disabled Save", async () => {
    renderDesktopWithAccount();
    await openDialogAndExpect(labels.editPin);
  });

  test("edit pin dialog: typing a value and clicking Save calls onSetTwoStepPin", async () => {
    const { onSetTwoStepPin } = renderDesktopWithAccount();
    await submitCredentialDialog(labels.editPin, labels.twoStepPinPlaceholder, "123456", onSetTwoStepPin);
  });

  test("credential dialog Cancel button closes dialog without calling set handler", async () => {
    const { onSetAccessToken } = renderDesktopWithAccount();
    await openActionMenu();
    await act(async () => {
      fireEvent.click(screen.getByText(labels.editToken));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: labels.cancel }));
    });
    expect(onSetAccessToken).toHaveBeenCalledTimes(0);
  });
});

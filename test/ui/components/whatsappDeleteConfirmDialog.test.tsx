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

describe("DeleteConfirmDialog (via NumbersTabDesktop)", () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  test("shows account display name in the delete confirm message", () => {
    const mockOnDelete = mock(noopPromise);
    renderWithWrapper(
      <NumbersTabDesktop
        {...baseProps}
        accounts={[makeAccountRow("acc-99", "+555", "My Test Account")]}
        dialogState={{ type: "deleteConfirm", accountId: "acc-99", displayName: "My Test Account" }}
        onDeleteAccount={mockOnDelete}
      />,
      { locale: "en", permissions: [AppPermission.WhatsappConfigManage] }
    );
    expect(screen.getByText(testSettingsLabels.page.deleteConfirmMessage("My Test Account"))).toBeTruthy();
  });

  test("Cancel button does NOT call onDeleteAccount", async () => {
    const onDelete = mock(noopPromise);
    const onClose = mock(() => {});
    renderWithWrapper(
      <NumbersTabDesktop
        {...baseProps}
        dialogState={{ type: "deleteConfirm", accountId: "acc-1", displayName: "Account 1" }}
        onDeleteAccount={onDelete}
        onCloseDialog={onClose}
      />,
      { locale: "en", permissions: [AppPermission.WhatsappConfigManage] }
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: testSettingsLabels.page.cancel }));
    });
    expect(onDelete).toHaveBeenCalledTimes(0);
  });

  test("Confirm button calls onDeleteAccount with the correct account ID", async () => {
    const onDelete = mock(noopPromise);
    renderWithWrapper(
      <NumbersTabDesktop
        {...baseProps}
        dialogState={{ type: "deleteConfirm", accountId: "acc-42", displayName: "Account 42" }}
        onDeleteAccount={onDelete}
      />,
      { locale: "en", permissions: [AppPermission.WhatsappConfigManage] }
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: testSettingsLabels.page.deleteAccount }));
    });
    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(firstCallArgString(onDelete)).toBe("acc-42");
    });
  });
});

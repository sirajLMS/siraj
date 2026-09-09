import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { act, cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import type { WhatsappSettingsLabels } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import {
  validateAccessToken,
  validateDisplayName,
  validatePhoneNumberId,
  validatePurpose,
  validateTwoStepPin,
  validateWabaId,
} from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappFormValidation";
import { NumbersTabDesktop } from "@/frontend/desktop/views/dashboard/settings/whatsapp/tabs/NumbersTab.desktop";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { firstCallArgString, makeAccountRow } from "@/test/ui/components/helpers/whatsappTestHelpers";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";
const labels = readTranslation(Translation.Whatsapp, locale);

const settingsLabels: WhatsappSettingsLabels = {
  page: labels,
  notifications: {
    syncSuccess: labels.syncSuccess,
    syncSuccessWithCounts: labels.syncSuccessWithCounts,
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

const noopPromise = (): Promise<void> => Promise.resolve();

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
  onSetAccessToken: mock(noopPromise),
  onTestAccessToken: mock(() => Promise.resolve("success" as const)),
  tokenTestStates: {},
  onSetTwoStepPin: mock(noopPromise),
  onOpenCreateDialog: mock(() => {}),
  onOpenEditNameDialog: mock(() => {}),
  onCloseDialog: mock(() => {}),
  onCreate: mock(noopPromise),
  onEditName: mock(noopPromise),
  onUpdatePurpose: mock(noopPromise),
  validateDisplayName,
  validatePhoneNumberId,
  validateWabaId,
  validatePurpose,
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
      { locale, permissions: [AppPermission.WhatsappConfigManage] }
    );
    expect(screen.getByText(labels.deleteConfirmMessage("My Test Account"))).toBeTruthy();
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
      { locale, permissions: [AppPermission.WhatsappConfigManage] }
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: labels.cancel }));
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
      { locale, permissions: [AppPermission.WhatsappConfigManage] }
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: labels.deleteAccount }));
    });
    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(firstCallArgString(onDelete)).toBe("acc-42");
    });
  });
});

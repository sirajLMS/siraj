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
    localDeactivateSuccess: labels.localDeactivateSuccess,
    localDeactivateError: labels.localDeactivateError,
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
  localDeactivatingId: null,
  syncingId: null,
  editingTokenForId: null,
  editingPinForId: null,
  isConfigured: true,
  creating: false,
  updatingId: null,
  mutationError: null,
  onSyncFromMeta: mock(noopPromise),
  onDismissSnackbar: mock(() => {}),
  onLocalDeactivateConfirmDialog: mock(() => {}),
  onOpenManageRecipients: mock(() => {}),
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

describe("LocalDeactivateConfirmDialog (via NumbersTabDesktop)", () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  test("shows account display name in the local-deactivate confirm message", () => {
    const mockOnLocalDeactivate = mock(noopPromise);
    renderWithWrapper(
      <NumbersTabDesktop
        {...baseProps}
        accounts={[makeAccountRow("acc-99", "+555", "My Test Account")]}
        dialogState={{ type: "localDeactivateConfirm", accountId: "acc-99", displayName: "My Test Account" }}
        onLocalDeactivateAccount={mockOnLocalDeactivate}
      />,
      { locale, permissions: [AppPermission.WhatsappConfigManage] }
    );
    expect(screen.getByText(labels.localDeactivateConfirmMessage("My Test Account"))).toBeTruthy();
  });

  test("Cancel button does NOT call onLocalDeactivateAccount", async () => {
    const onLocalDeactivate = mock(noopPromise);
    const onClose = mock(() => {});
    renderWithWrapper(
      <NumbersTabDesktop
        {...baseProps}
        dialogState={{ type: "localDeactivateConfirm", accountId: "acc-1", displayName: "Account 1" }}
        onLocalDeactivateAccount={onLocalDeactivate}
        onCloseDialog={onClose}
      />,
      { locale, permissions: [AppPermission.WhatsappConfigManage] }
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: labels.cancel }));
    });
    expect(onLocalDeactivate).toHaveBeenCalledTimes(0);
  });

  test("Confirm button calls onLocalDeactivateAccount with the correct account ID", async () => {
    const onLocalDeactivate = mock(noopPromise);
    renderWithWrapper(
      <NumbersTabDesktop
        {...baseProps}
        dialogState={{ type: "localDeactivateConfirm", accountId: "acc-42", displayName: "Account 42" }}
        onLocalDeactivateAccount={onLocalDeactivate}
      />,
      { locale, permissions: [AppPermission.WhatsappConfigManage] }
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: labels.localDeactivateAccount }));
    });
    await waitFor(() => {
      expect(onLocalDeactivate).toHaveBeenCalledTimes(1);
      expect(firstCallArgString(onLocalDeactivate)).toBe("acc-42");
    });
  });
});

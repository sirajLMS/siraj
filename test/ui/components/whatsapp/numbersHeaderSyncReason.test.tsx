import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import type { NumbersTabSharedProps } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps";
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
import { NumbersTabMobile } from "@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/NumbersTab.mobile";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "en";
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
    optInSuccess: labels.optInEnabled,
    optInError: labels.optInError,
  },
};

const missingEnvReason = labels.syncFromMetaUnavailable("WHATSAPP_ACCESS_TOKEN, WHATSAPP_WABA_ID");

function makeNumbersProps(overrides: Partial<NumbersTabSharedProps> = {}): NumbersTabSharedProps {
  return {
    labels: settingsLabels,
    accounts: [],
    loading: false,
    syncing: false,
    snackbar: null,
    localDeactivatingId: null,
    syncingId: null,
    onLocalDeactivateConfirmDialog: mock(() => {}),
    onOpenManageRecipients: mock(() => {}),
    onLocalDeactivateAccount: mock(() => Promise.resolve()),
    onSetAccessToken: mock(() => Promise.resolve()),
    onTestAccessToken: mock(() => Promise.resolve("success" as const)),
    tokenTestStates: {},
    onSetTwoStepPin: mock(() => Promise.resolve()),
    onSyncFromMeta: mock(() => Promise.resolve()),
    onDismissSnackbar: mock(() => {}),
    isConfigured: true,
    editingTokenForId: null,
    editingPinForId: null,
    creating: false,
    updatingId: null,
    dialogState: { type: null },
    mutationError: null,
    onCreate: mock(() => Promise.resolve()),
    onEditName: mock(() => Promise.resolve()),
    onUpdatePurpose: mock(() => Promise.resolve()),
    onOpenCreateDialog: mock(() => {}),
    onOpenEditNameDialog: mock(() => {}),
    onCloseDialog: mock(() => {}),
    validateDisplayName,
    validatePhoneNumberId,
    validateWabaId,
    validatePurpose,
    validateAccessToken,
    validateTwoStepPin,
    ...overrides,
  };
}

/** Disabled buttons suppress pointer events, so the tooltip lives on the wrapping span. */
async function hoverSyncTooltip(syncButton: HTMLElement): Promise<void> {
  const tooltipAnchor = syncButton.parentElement;
  expect(tooltipAnchor).not.toBeNull();
  if (tooltipAnchor === null) return;
  fireEvent.mouseOver(tooltipAnchor);
}

beforeEach(() => {
  cleanup();
});

afterEach(() => {
  cleanup();
});

async function verifyUnconfiguredSyncButton(component: React.ReactElement): Promise<void> {
  renderWithWrapper(component, { locale, permissions: [AppPermission.WhatsappConfigManage] });

  const syncButton = screen.getByRole("button", { name: labels.syncFromMeta });
  expect(syncButton).toBeDisabled();

  await hoverSyncTooltip(syncButton);
  expect(await screen.findByText(missingEnvReason)).toBeInTheDocument();
}

describe("NumbersTab header — sync disabled reason tooltip", () => {
  test("desktop: unconfigured sync button is disabled and reveals the reason on hover", async () => {
    await verifyUnconfiguredSyncButton(
      <NumbersTabDesktop {...makeNumbersProps({ isConfigured: false, syncDisabledReason: missingEnvReason })} />
    );
  });

  test("mobile: unconfigured sync icon button is disabled and reveals the reason on hover", async () => {
    await verifyUnconfiguredSyncButton(
      <NumbersTabMobile {...makeNumbersProps({ isConfigured: false, syncDisabledReason: missingEnvReason })} />
    );
  });

  test("desktop: busy reason tooltip shows while syncing", async () => {
    renderWithWrapper(
      <NumbersTabDesktop {...makeNumbersProps({ syncing: true, syncDisabledReason: labels.syncFromMetaBusy })} />,
      { locale, permissions: [AppPermission.WhatsappConfigManage] }
    );

    const syncButton = screen.getByRole("button", { name: labels.syncFromMeta });
    expect(syncButton).toBeDisabled();
    expect(syncButton).toHaveAttribute("aria-busy", "true");

    await hoverSyncTooltip(syncButton);
    expect(await screen.findByText(labels.syncFromMetaBusy)).toBeInTheDocument();
  });

  test("enabled sync button shows its label tooltip without a reason", async () => {
    renderWithWrapper(<NumbersTabDesktop {...makeNumbersProps()} />, {
      locale,
      permissions: [AppPermission.WhatsappConfigManage],
    });

    const syncButton = screen.getByRole("button", { name: labels.syncFromMeta });
    expect(syncButton).toBeEnabled();

    await hoverSyncTooltip(syncButton);
    await waitFor(() => {
      expect(screen.getAllByText(labels.syncFromMeta).length).toBeGreaterThanOrEqual(2);
    });
  });
});

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
import { NumbersTabMobile } from "@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/NumbersTab.mobile";
import { OptInTabMobile } from "@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/OptInTab.mobile";
import { TemplatesTabMobile } from "@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/TemplatesTab.mobile";
import {
  makeAccountRow,
  makeAdminUser,
  makeAuditEntry,
  makeTemplateRow,
  testSettingsLabels,
} from "@/test/ui/components/helpers/whatsappTestHelpers";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const noopPromise = (): Promise<void> => Promise.resolve();

const mobileNumbersProps = {
  labels: testSettingsLabels,
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

describe("Mobile parity — NumbersTab CRUD", () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  test("account card renders with action menu button", () => {
    renderWithWrapper(
      <NumbersTabMobile
        {...mobileNumbersProps}
        accounts={[makeAccountRow("acc-1", "+555", "Business Account")]}
        dialogState={{ type: null }}
      />,
      { locale: "en", permissions: [AppPermission.WhatsappConfigManage] }
    );
    // Account name should render
    expect(screen.getByText("Business Account")).toBeTruthy();
    // Action menu button (aria-label=editAccount)
    expect(screen.getByLabelText(testSettingsLabels.page.editAccount)).toBeTruthy();
  });

  test("action menu opens when button clicked and shows menu items", async () => {
    renderWithWrapper(
      <NumbersTabMobile
        {...mobileNumbersProps}
        accounts={[makeAccountRow("acc-1", "+555", "Business Account")]}
        dialogState={{ type: null }}
      />,
      { locale: "en", permissions: [AppPermission.WhatsappConfigManage] }
    );
    await act(async () => {
      fireEvent.click(screen.getByLabelText(testSettingsLabels.page.editAccount));
    });
    await waitFor(() => {
      expect(screen.getByText(testSettingsLabels.page.editName)).toBeTruthy();
      expect(screen.getByText(testSettingsLabels.page.editToken)).toBeTruthy();
      expect(screen.getByText(testSettingsLabels.page.editPin)).toBeTruthy();
      expect(screen.getByText(testSettingsLabels.page.deleteAccount)).toBeTruthy();
    });
  });

  test("create dialog renders when dialogState.type is 'create'", () => {
    renderWithWrapper(<NumbersTabMobile {...mobileNumbersProps} accounts={[]} dialogState={{ type: "create" }} />, {
      locale: "en",
      permissions: [AppPermission.WhatsappConfigManage],
    });
    expect(screen.getByText(testSettingsLabels.page.createAccountTitle)).toBeTruthy();
  });

  test("empty accounts state shows add-first-number button", () => {
    renderWithWrapper(<NumbersTabMobile {...mobileNumbersProps} accounts={[]} dialogState={{ type: null }} />, {
      locale: "en",
      permissions: [AppPermission.WhatsappConfigManage],
    });
    expect(screen.getByText(testSettingsLabels.page.noAccounts)).toBeTruthy();
    expect(screen.getByText(testSettingsLabels.page.addFirstNumber)).toBeTruthy();
  });

  test("delete confirm dialog shows on mobile when dialogState.type is 'deleteConfirm'", () => {
    renderWithWrapper(
      <NumbersTabMobile
        {...mobileNumbersProps}
        accounts={[makeAccountRow("acc-1")]}
        dialogState={{ type: "deleteConfirm", accountId: "acc-1", displayName: "Delete Me" }}
      />,
      { locale: "en", permissions: [AppPermission.WhatsappConfigManage] }
    );
    expect(screen.getByText(testSettingsLabels.page.deleteConfirmTitle)).toBeTruthy();
    expect(screen.getByText(testSettingsLabels.page.deleteConfirmMessage("Delete Me"))).toBeTruthy();
  });
});

describe("Mobile parity — TemplatesTab expandable cards", () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  test("mobile templates render as cards with names", async () => {
    const t1 = makeTemplateRow("tpl-1", "Welcome Message");
    renderWithWrapper(
      <TemplatesTabMobile
        labels={testSettingsLabels}
        templates={[t1]}
        loading={false}
        syncing={false}
        onSyncFromMeta={mock(noopPromise)}
        isConfigured
        queryError={false}
        onRetry={mock(() => {})}
      />,
      { locale: "en", permissions: [AppPermission.WhatsappTemplatesManage] }
    );
    // MobileCardList may suspend on first render; use findByText to wait
    const nameEl = await screen.findByText("Welcome Message");
    expect(nameEl).toBeTruthy();
  });

  test("mobile template card expands when clicked", async () => {
    const t1 = makeTemplateRow("tpl-1", "Welcome Message");
    renderWithWrapper(
      <TemplatesTabMobile
        labels={testSettingsLabels}
        templates={[t1]}
        loading={false}
        syncing={false}
        onSyncFromMeta={mock(noopPromise)}
        isConfigured
        queryError={false}
        onRetry={mock(() => {})}
      />,
      { locale: "en", permissions: [AppPermission.WhatsappTemplatesManage] }
    );
    // Click the card's expand area
    const expandArea = screen.getByLabelText(`Welcome Message — ${testSettingsLabels.page.templateBody}`);
    await act(async () => {
      fireEvent.click(expandArea);
    });
    // After expansion, detail fields should be visible
    await waitFor(() => {
      expect(screen.getAllByText(testSettingsLabels.page.templateCategory).length).toBeGreaterThan(0);
    });
  });

  test("mobile templates error state shows retry button", () => {
    renderWithWrapper(
      <TemplatesTabMobile
        labels={testSettingsLabels}
        templates={[]}
        loading={false}
        syncing={false}
        onSyncFromMeta={mock(noopPromise)}
        isConfigured
        queryError
        onRetry={mock(() => {})}
      />,
      { locale: "en", permissions: [AppPermission.WhatsappTemplatesManage] }
    );
    expect(screen.getByText(testSettingsLabels.page.retry)).toBeTruthy();
  });
});

describe("Mobile parity — OptInTab history cards", () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  test("mobile opt-in renders toggle and history audit entries as cards", async () => {
    const entries = [
      { ...makeAuditEntry("a-1", "optIn"), date: "2025-01-15T10:00:00Z" },
      { ...makeAuditEntry("a-2", "optOut"), date: "2025-01-16T12:00:00Z" },
    ];
    renderWithWrapper(
      <OptInTabMobile
        labels={testSettingsLabels}
        isOptedIn={false}
        optInLoading={false}
        onToggleOptIn={mock(noopPromise)}
        auditEntries={entries}
        dateRange={{ from: null, to: null }}
        onDateRangeChange={mock(() => {})}
        onExportCsv={mock(() => {})}
        adminUsers={[]}
      />,
      { locale: "en", permissions: [AppPermission.WhatsappConfigManage] }
    );
    // Toggle rendered
    expect(screen.getByRole("switch")).toBeTruthy();
    // Audit entry dates rendered (wait for Suspense to resolve)
    const d1 = await screen.findByText(entries[0].date);
    expect(d1).toBeTruthy();
    const d2 = await screen.findByText(entries[1].date);
    expect(d2).toBeTruthy();
  });

  test("mobile admin section renders users as cards", () => {
    const users = [makeAdminUser("u-1", "Alice", true), makeAdminUser("u-2", "Bob", false)];
    renderWithWrapper(
      <OptInTabMobile
        labels={testSettingsLabels}
        isOptedIn={false}
        optInLoading={false}
        onToggleOptIn={mock(noopPromise)}
        auditEntries={[]}
        dateRange={{ from: null, to: null }}
        onDateRangeChange={mock(() => {})}
        onExportCsv={mock(() => {})}
        adminUsers={users}
      />,
      { locale: "en", permissions: [AppPermission.WhatsappConfigManage] }
    );
    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.getByText("Bob")).toBeTruthy();
  });
});

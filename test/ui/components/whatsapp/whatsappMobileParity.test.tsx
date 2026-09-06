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
import { NumbersTabMobile } from "@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/NumbersTab.mobile";
import { OptInTabMobile } from "@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/OptInTab.mobile";
import { TemplatesTabMobile } from "@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/TemplatesTab.mobile";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import {
  makeAccountRow,
  makeAdminUser,
  makeAuditEntry,
  makeTemplateRow,
} from "@/test/ui/components/helpers/whatsappTestHelpers";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";
const labels = readTranslation(Translation.Whatsapp, locale);
const adminLabels = readTranslation(Translation.Dashboard.Admin, locale);

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

const noopPromise = (): Promise<void> => Promise.resolve();

const mobileNumbersProps = {
  labels: settingsLabels,
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
  onUpdatePurpose: mock(noopPromise),
  validateDisplayName,
  validatePhoneNumberId,
  validateWabaId,
  validatePurpose,
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
      { locale, permissions: [AppPermission.WhatsappConfigManage] }
    );
    // Account name should render
    expect(screen.getByText("Business Account")).toBeTruthy();
    // Action menu button (aria-label=editAccount)
    expect(screen.getByLabelText(labels.editAccount)).toBeTruthy();
  });

  test("action menu opens when button clicked and shows menu items", async () => {
    renderWithWrapper(
      <NumbersTabMobile
        {...mobileNumbersProps}
        accounts={[makeAccountRow("acc-1", "+555", "Business Account")]}
        dialogState={{ type: null }}
      />,
      { locale, permissions: [AppPermission.WhatsappConfigManage] }
    );
    await act(async () => {
      fireEvent.click(screen.getByLabelText(labels.editAccount));
    });
    await waitFor(() => {
      expect(screen.getByText(labels.editName)).toBeTruthy();
      expect(screen.getByText(labels.editToken)).toBeTruthy();
      expect(screen.getByText(labels.editPin)).toBeTruthy();
      expect(screen.getByText(labels.deleteAccount)).toBeTruthy();
    });
  });

  test("create dialog renders when dialogState.type is 'create'", () => {
    renderWithWrapper(<NumbersTabMobile {...mobileNumbersProps} accounts={[]} dialogState={{ type: "create" }} />, {
      locale,
      permissions: [AppPermission.WhatsappConfigManage],
    });
    expect(screen.getByText(labels.createAccountTitle)).toBeTruthy();
  });

  test("empty accounts state shows add-first-number button", () => {
    renderWithWrapper(<NumbersTabMobile {...mobileNumbersProps} accounts={[]} dialogState={{ type: null }} />, {
      locale,
      permissions: [AppPermission.WhatsappConfigManage],
    });
    expect(screen.getByText(labels.noAccounts)).toBeTruthy();
    expect(screen.getByText(labels.addFirstNumber)).toBeTruthy();
  });

  test("delete confirm dialog shows on mobile when dialogState.type is 'deleteConfirm'", () => {
    renderWithWrapper(
      <NumbersTabMobile
        {...mobileNumbersProps}
        accounts={[makeAccountRow("acc-1")]}
        dialogState={{ type: "deleteConfirm", accountId: "acc-1", displayName: "Delete Me" }}
      />,
      { locale, permissions: [AppPermission.WhatsappConfigManage] }
    );
    expect(screen.getByText(labels.deleteConfirmTitle)).toBeTruthy();
    expect(screen.getByText(labels.deleteConfirmMessage("Delete Me"))).toBeTruthy();
  });
});

describe("Mobile numbers list — MobileCardList client pagination", () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  function renderPaginatedNumbers(count: number) {
    const accounts = Array.from({ length: count }, (_, i) =>
      makeAccountRow(`acc-${i + 1}`, `+1555000${String(i).padStart(2, "0")}`, `Number ${i + 1}`)
    );
    renderWithWrapper(<NumbersTabMobile {...mobileNumbersProps} accounts={accounts} dialogState={{ type: null }} />, {
      locale,
      permissions: [AppPermission.WhatsappConfigManage],
    });
  }

  test("renders the first page of 10 accounts with the list-owned pager", async () => {
    renderPaginatedNumbers(12);

    // First page shows accounts 1–10 only (client pagination, pageSize 10)
    expect(await screen.findByText("Number 1")).toBeTruthy();
    expect(screen.getByText("Number 10")).toBeTruthy();
    expect(screen.queryByText("Number 11")).toBeNull();

    // The list primitive owns the pager — range label is rendered once
    expect(screen.getByText(adminLabels.paginationRange(1, 10, 12))).toBeTruthy();
    expect(screen.getByLabelText(adminLabels.nextPage)).toBeTruthy();

    // Metadata renders as labelled Typography pairs, not ad-hoc chips
    expect(screen.getAllByText(labels.qualityRating)).toHaveLength(10);
    expect(screen.getAllByText(labels.messagingTier)).toHaveLength(10);
  });

  test("navigating to the next page renders the remaining accounts", async () => {
    renderPaginatedNumbers(12);

    const nextButton = screen.getByLabelText(adminLabels.nextPage).querySelector("button");
    expect(nextButton).not.toBeNull();
    if (nextButton) {
      await act(async () => {
        fireEvent.click(nextButton);
      });
    }

    await waitFor(() => {
      expect(screen.getByText("Number 11")).toBeTruthy();
      expect(screen.getByText("Number 12")).toBeTruthy();
      expect(screen.queryByText("Number 1")).toBeNull();
    });
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
        labels={settingsLabels}
        templates={[t1]}
        loading={false}
        syncing={false}
        onSyncFromMeta={mock(noopPromise)}
        isConfigured
        queryError={false}
        onRetry={mock(() => {})}
      />,
      { locale, permissions: [AppPermission.WhatsappTemplatesManage] }
    );
    // MobileCardList may suspend on first render; use findByText to wait
    const nameEl = await screen.findByText("Welcome Message");
    expect(nameEl).toBeTruthy();
  });

  test("mobile template card expands when clicked", async () => {
    const t1 = makeTemplateRow("tpl-1", "Welcome Message");
    renderWithWrapper(
      <TemplatesTabMobile
        labels={settingsLabels}
        templates={[t1]}
        loading={false}
        syncing={false}
        onSyncFromMeta={mock(noopPromise)}
        isConfigured
        queryError={false}
        onRetry={mock(() => {})}
      />,
      { locale, permissions: [AppPermission.WhatsappTemplatesManage] }
    );
    // Click the card's expand area
    const expandArea = screen.getByLabelText(`Welcome Message — ${labels.templateBody}`);
    await act(async () => {
      fireEvent.click(expandArea);
    });
    // After expansion, detail fields should be visible
    await waitFor(() => {
      expect(screen.getAllByText(labels.templateCategory).length).toBeGreaterThan(0);
    });
  });

  test("mobile template card shows labeled pairs and localized status badge", async () => {
    const t1 = makeTemplateRow("tpl-1", "Welcome Message");
    renderWithWrapper(
      <TemplatesTabMobile
        labels={settingsLabels}
        templates={[t1]}
        loading={false}
        syncing={false}
        onSyncFromMeta={mock(noopPromise)}
        isConfigured
        queryError={false}
        onRetry={mock(() => {})}
      />,
      { locale, permissions: [AppPermission.WhatsappTemplatesManage] }
    );
    // Labeled Typography pairs replace the old raw Chips
    expect(await screen.findByText(labels.templateLanguage)).toBeTruthy();
    expect(screen.getByText(t1.language ?? "")).toBeTruthy();
    // Status badge shows the localized status label
    expect(screen.getByText(labels.templateStatusApproved)).toBeTruthy();
  });

  test("mobile template cards render through the shared scaffold details", async () => {
    const t1 = makeTemplateRow("tpl-1", "Welcome Message");
    renderWithWrapper(
      <TemplatesTabMobile
        labels={settingsLabels}
        templates={[t1]}
        loading={false}
        syncing={false}
        onSyncFromMeta={mock(noopPromise)}
        isConfigured
        queryError={false}
        onRetry={mock(() => {})}
      />,
      { locale, permissions: [AppPermission.WhatsappTemplatesManage] }
    );
    const expandArea = screen.getByLabelText(`Welcome Message — ${labels.templateBody}`);
    await act(async () => {
      fireEvent.click(expandArea);
    });
    // Expanded detail stack shows localized status and last-synced fields
    await waitFor(() => {
      expect(screen.getByText(labels.templateStatus)).toBeTruthy();
      expect(screen.getByText(labels.templateLastUpdated)).toBeTruthy();
    });
  });

  test("mobile templates error state shows retry button", () => {
    renderWithWrapper(
      <TemplatesTabMobile
        labels={settingsLabels}
        templates={[]}
        loading={false}
        syncing={false}
        onSyncFromMeta={mock(noopPromise)}
        isConfigured
        queryError
        onRetry={mock(() => {})}
      />,
      { locale, permissions: [AppPermission.WhatsappTemplatesManage] }
    );
    expect(screen.getByText(labels.retry)).toBeTruthy();
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
        labels={settingsLabels}
        isOptedIn={false}
        optInLoading={false}
        onToggleOptIn={mock(noopPromise)}
        auditEntries={entries}
        dateRange={{ from: null, to: null }}
        onDateRangeChange={mock(() => {})}
        onExportCsv={mock(() => {})}
        adminUsers={[]}
      />,
      { locale, permissions: [AppPermission.WhatsappConfigManage] }
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
        labels={settingsLabels}
        isOptedIn={false}
        optInLoading={false}
        onToggleOptIn={mock(noopPromise)}
        auditEntries={[]}
        dateRange={{ from: null, to: null }}
        onDateRangeChange={mock(() => {})}
        onExportCsv={mock(() => {})}
        adminUsers={users}
      />,
      { locale, permissions: [AppPermission.WhatsappConfigManage] }
    );
    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.getByText("Bob")).toBeTruthy();
  });
});

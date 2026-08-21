import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { act, cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { OptInTabContent } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/OptInTabContent";
import type { WhatsappSettingsLabels } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import { OptInTabMobile } from "@/frontend/mobile/views/dashboard/settings/whatsapp/tabs/OptInTab.mobile";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { firstCallArgBoolean, makeAdminUser, makeAuditEntry } from "@/test/ui/components/helpers/whatsappTestHelpers";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

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

const noopPromise = (): Promise<void> => Promise.resolve();

function renderOptInTabContent(overrides: Record<string, unknown> = {}) {
  const onToggleOptIn = mock(noopPromise);
  renderWithWrapper(
    <OptInTabContent
      labels={settingsLabels}
      isOptedIn={false}
      optInLoading={false}
      onToggleOptIn={onToggleOptIn}
      auditEntries={[]}
      dateRange={{ from: null, to: null }}
      onDateRangeChange={mock(() => {})}
      onExportCsv={mock(() => {})}
      adminUsers={[]}
      {...overrides}
    />,
    { locale, permissions: [AppPermission.WhatsappConfigManage] }
  );
  return { onToggleOptIn };
}

describe("OptInTabContent — toggle (non-admin)", () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  test("toggle switch renders and works", async () => {
    const { onToggleOptIn } = renderOptInTabContent();
    const switchEl = screen.getByRole("switch");
    expect(switchEl).toBeTruthy();
    await act(async () => {
      fireEvent.click(switchEl);
    });
    await waitFor(() => {
      expect(onToggleOptIn).toHaveBeenCalledTimes(1);
      expect(firstCallArgBoolean(onToggleOptIn)).toBe(true);
    });
  });

  test("opt-in status label shows 'disabled' when not opted in", () => {
    renderOptInTabContent({ isOptedIn: false });
    expect(screen.getByText(labels.optInDisabled)).toBeTruthy();
  });

  test("opt-in status label shows 'enabled' when opted in", () => {
    renderOptInTabContent({ isOptedIn: true });
    expect(screen.getByText(labels.optInEnabled)).toBeTruthy();
  });

  test("optInLoading shows CircularProgress instead of switch", () => {
    renderOptInTabContent({ optInLoading: true });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    // Switch should NOT be present
    expect(screen.queryByRole("switch")).toBeNull();
  });
});

describe("OptInTabContent — history entries", () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  test("history section renders with custom historySection ReactNode", () => {
    renderOptInTabContent({
      historySection: <div data-testid="custom-history">Custom History</div>,
    });
    expect(screen.getByTestId("custom-history")).toBeTruthy();
  });

  test("opt-in history title and subtitle are rendered", () => {
    renderOptInTabContent();
    expect(screen.getByText(labels.optInHistoryTitle)).toBeTruthy();
    expect(screen.getByText(labels.optInHistorySubtitle)).toBeTruthy();
  });
});

describe("OptInTabContent — admin consolidated view", () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  test("admin section renders when user has WhatsappConfigManage permission", () => {
    renderOptInTabContent({
      adminSection: <div data-testid="custom-admin">Admin Panel</div>,
    });
    expect(screen.getByTestId("custom-admin")).toBeTruthy();
  });

  test("admin section shows permission denied when user lacks permission", () => {
    renderWithWrapper(
      <OptInTabContent
        labels={settingsLabels}
        isOptedIn={false}
        optInLoading={false}
        onToggleOptIn={mock(noopPromise)}
        auditEntries={[]}
        dateRange={{ from: null, to: null }}
        onDateRangeChange={mock(() => {})}
        onExportCsv={mock(() => {})}
        adminUsers={[]}
        adminSection={<div data-testid="custom-admin">Admin Panel</div>}
      />,
      { locale, permissions: [] }
    );
    expect(screen.getByText(labels.permissionDeniedTitle)).toBeTruthy();
    expect(screen.queryByTestId("custom-admin")).toBeNull();
  });
});

describe("OptInTabMobile — integration with shared content", () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  test("mobile wrapper renders toggle and admin section with user rows", async () => {
    const adminUser = makeAdminUser("u-1", "Alice", true);
    renderWithWrapper(
      <OptInTabMobile
        labels={settingsLabels}
        isOptedIn={false}
        optInLoading={false}
        onToggleOptIn={mock(noopPromise)}
        auditEntries={[makeAuditEntry("a-1", "optIn")]}
        dateRange={{ from: null, to: null }}
        onDateRangeChange={mock(() => {})}
        onExportCsv={mock(() => {})}
        adminUsers={[adminUser]}
      />,
      { locale, permissions: [AppPermission.WhatsappConfigManage] }
    );
    // Wait for Suspense to resolve: both the toggle and the admin user row
    // render asynchronously when MobileCardList lazy-loads its internals.
    await waitFor(() => {
      expect(screen.getByRole("switch")).toBeTruthy();
    });
    const userEl = await screen.findByText("Alice");
    expect(userEl).toBeTruthy();
  });

  test("mobile wrapper renders history entries as cards", async () => {
    const auditEntry = makeAuditEntry("a-1", "optIn");
    renderWithWrapper(
      <OptInTabMobile
        labels={settingsLabels}
        isOptedIn={false}
        optInLoading={false}
        onToggleOptIn={mock(noopPromise)}
        auditEntries={[auditEntry]}
        dateRange={{ from: null, to: null }}
        onDateRangeChange={mock(() => {})}
        onExportCsv={mock(() => {})}
        adminUsers={[]}
      />,
      { locale, permissions: [AppPermission.WhatsappConfigManage] }
    );
    // The audit entry date should be rendered in the card
    const dateEl = await screen.findByText(auditEntry.date);
    expect(dateEl).toBeTruthy();
    // The "changed by" label should be present
    expect(screen.getByText(new RegExp(auditEntry.changedBy))).toBeTruthy();
  });
});

import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import type { OptInTabSharedProps } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps";
import type { WhatsappSettingsLabels } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import { OptInTabDesktop } from "@/frontend/desktop/views/dashboard/settings/whatsapp/tabs/OptInTab.desktop";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { makeAdminUser } from "@/test/ui/components/helpers/whatsappTestHelpers";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "en";
const labels = readTranslation(Translation.Whatsapp, locale);
const tableLabels = readTranslation(Translation.Dashboard.Admin, locale);

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

function renderDesktopOptInTab(overrides: Partial<OptInTabSharedProps> = {}) {
  const onDateRangeChange = mock<(range: { from: string | null; to: string | null }) => void>(() => {});
  const props: OptInTabSharedProps = {
    labels: settingsLabels,
    isOptedIn: false,
    optInLoading: false,
    onToggleOptIn: mock(() => Promise.resolve()),
    auditEntries: [],
    dateRange: { from: null, to: null },
    onDateRangeChange,
    onExportCsv: mock(() => {}),
    adminUsers: [],
    ...overrides,
  };
  const renderResult = renderWithWrapper(<OptInTabDesktop {...props} />, {
    locale,
    permissions: [AppPermission.WhatsappConfigManage],
  });
  return { renderResult, props, onDateRangeChange };
}

describe("OptInTabDesktop — admin search (SearchBarField)", () => {
  beforeEach(cleanup);
  afterEach(cleanup);

  test("typing in the search field filters the admin user grid", async () => {
    renderDesktopOptInTab({
      adminUsers: [makeAdminUser("u-1", "Alice Ahmed", true), makeAdminUser("u-2", "Bob Mahmoud", true)],
    });

    const searchInput = screen.getByPlaceholderText(labels.optInAdminSearchPlaceholder);
    expect(searchInput).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Bob Mahmoud")).toBeInTheDocument();
    });

    fireEvent.change(searchInput, { target: { value: "Alice" } });

    await waitFor(() => {
      expect(screen.queryByText("Bob Mahmoud")).toBeNull();
    });
    expect(screen.getByText("Alice Ahmed")).toBeInTheDocument();
  });
});

describe("OptInTabDesktop — history date range (DesktopAppDateRangePicker)", () => {
  beforeEach(cleanup);
  afterEach(cleanup);

  test("renders a single filter trigger field labelled with the filter label", () => {
    renderDesktopOptInTab();
    expect(screen.getByLabelText(labels.optInHistoryFilter)).toBeInTheDocument();
  });

  test("opening the range picker and picking a from-date calls onDateRangeChange", async () => {
    const { onDateRangeChange } = renderDesktopOptInTab({ dateRange: { from: null, to: null } });

    fireEvent.click(screen.getByLabelText(labels.optInHistoryFilter));

    // The range popover renders a from and a to single-date picker.
    const fromGroup = await screen.findByRole("group", { name: labels.optInHistoryFilterFrom });
    expect(screen.getByRole("group", { name: labels.optInHistoryFilterTo })).toBeInTheDocument();

    // Open the from picker's calendar popup and pick the 15th day cell.
    // Day numbers are calendar renderer data (locale "en" here), not UI labels.
    const openCalendarButton = fromGroup.querySelector("button");
    if (!openCalendarButton) {
      throw new Error("expected a calendar open button inside the from picker");
    }
    fireEvent.click(openCalendarButton);

    const dayCell = (await screen.findAllByRole("gridcell")).find(el => el.textContent === "15");
    if (!dayCell) {
      throw new Error("expected a day cell for the 15th in the calendar popup");
    }
    fireEvent.click(dayCell);

    await waitFor(() => {
      expect(onDateRangeChange).toHaveBeenCalled();
    });
    const firstCall = onDateRangeChange.mock.calls[0]?.[0];
    expect(firstCall?.from).toMatch(/^\d{4}-\d{2}-15$/);
    expect(firstCall?.to).toBeNull();
  });
});

describe("OptInTabDesktop — admin grid pagination", () => {
  beforeEach(cleanup);
  afterEach(cleanup);

  test("client pagination shows page range and navigates to page 2", async () => {
    const adminUsers = Array.from({ length: 11 }, (_, i) => makeAdminUser(`u-${i}`, `User ${i}`, true));
    renderDesktopOptInTab({ adminUsers });

    // Initial range: rows 1-10 of 11 (client pagination, pageSize 10).
    await waitFor(() => {
      expect(screen.getByText(tableLabels.paginationRange(1, 10, 11))).toBeInTheDocument();
    });

    // Two grids render pagination controls; the history grid is empty here so
    // only the admin grid's go-to-page input is enabled.
    const pageInputs = screen
      .getAllByLabelText(tableLabels.goToPage)
      .filter((el): el is HTMLInputElement => el instanceof HTMLInputElement && !el.disabled);
    expect(pageInputs).toHaveLength(1);

    const [pageInput] = pageInputs;
    if (!pageInput) {
      throw new Error("expected a single enabled go-to-page input");
    }
    fireEvent.change(pageInput, { target: { value: "2" } });
    fireEvent.keyDown(pageInput, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByText(tableLabels.paginationRange(11, 11, 11))).toBeInTheDocument();
    });
    expect(screen.getByText("User 10")).toBeInTheDocument();
    expect(screen.queryByText("User 0")).toBeNull();
  });

  test("empty admin grid shows the no-data pagination label", () => {
    renderDesktopOptInTab({ adminUsers: [] });
    expect(screen.getAllByText(tableLabels.noData).length).toBeGreaterThan(0);
  });
});

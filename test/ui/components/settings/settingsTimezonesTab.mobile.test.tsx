import { describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { fireEvent, screen } from "@testing-library/react";

expect.extend(matchers);

import type {
  SettingsTimezoneRow,
  SettingsTimezonesViewModel,
} from "@/frontend/common/views/dashboard/settings/types/settingsTimezones.types";
import { buildSettingsTimezoneColumns } from "@/frontend/common/views/dashboard/settings/utils/settingsTimezones.utils";
import { SettingsTimezonesTabMobileView } from "@/frontend/mobile/views/dashboard/settings/tabs/timezones/settingsTimezonesTab.mobile";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";
const timezonesLabels = readTranslation(Translation.Dashboard.SettingsTimezones, locale);
const adminLabels = readTranslation(Translation.Dashboard.Admin, locale);

function makeRow(index: number): SettingsTimezoneRow {
  return {
    id: `tz-${index}`,
    ianaId: `Region/City${index}`,
    name: `City ${index}`,
    offsetMinutes: 60,
    offsetLabel: "UTC+01:00",
    isDstSupported: false,
    isDstSupportedLabel: timezonesLabels.dstSupportedNo,
  };
}

const NOOP = () => {};

function buildViewModel(overrides: Partial<SettingsTimezonesViewModel> = {}): SettingsTimezonesViewModel {
  return {
    labels: timezonesLabels,
    rows: [makeRow(1)],
    columns: buildSettingsTimezoneColumns(timezonesLabels),
    page: 0,
    pageSize: 25,
    totalCount: 60,
    loading: false,
    searchQuery: "",
    isSearchPending: false,
    paginationMode: "server",
    onSearchChange: NOOP,
    onPageChange: NOOP,
    ...overrides,
  };
}

function renderTab(viewModel: SettingsTimezonesViewModel) {
  return renderWithWrapper(<SettingsTimezonesTabMobileView {...viewModel} />, { locale });
}

describe("SettingsTimezonesTab mobile view", () => {
  test("renders rows as cards without the desktop data grid", async () => {
    const { container } = renderTab(buildViewModel());

    expect(await screen.findByText("City 1")).toBeInTheDocument();
    expect(screen.getByText("UTC+01:00")).toBeInTheDocument();
    expect(container.querySelector(".MuiDataGrid-root")).toBeNull();
  });

  test("renders a server-mode pager and propagates onPageChange", async () => {
    const onPageChange = mock(() => {});
    renderTab(buildViewModel({ onPageChange }));

    await screen.findByText("City 1");
    expect(screen.getByText(adminLabels.paginationRange(1, 25, 60))).toBeInTheDocument();

    const nextButton = screen.getByLabelText(adminLabels.nextPage).querySelector("button");
    expect(nextButton).not.toBeNull();
    if (nextButton) {
      fireEvent.click(nextButton);
    }
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  test("paginates client-side when search mode switches paginationMode to client", async () => {
    const onPageChange = mock(() => {});
    const rows = Array.from({ length: 26 }, (_, index) => makeRow(index));
    renderTab(buildViewModel({ rows, totalCount: rows.length, paginationMode: "client", onPageChange }));

    await screen.findByText("City 0");
    expect(screen.queryByText("City 25")).toBeNull();

    const nextButton = screen.getByLabelText(adminLabels.nextPage).querySelector("button");
    expect(nextButton).not.toBeNull();
    if (nextButton) {
      fireEvent.click(nextButton);
    }

    expect(await screen.findByText("City 25")).toBeInTheDocument();
    expect(onPageChange).not.toHaveBeenCalled();
  });
});

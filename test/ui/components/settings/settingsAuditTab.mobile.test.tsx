import { describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { fireEvent, screen } from "@testing-library/react";

expect.extend(matchers);

import type { SettingsAuditRow } from "@/frontend/common/views/dashboard/settings/types/settingsAudit.types";
import type { SettingsAuditViewModel } from "@/frontend/common/views/dashboard/settings/types/settingsAuditViewModel.types";
import { buildSettingsAuditLabels } from "@/frontend/common/views/dashboard/settings/utils/settingsAudit.utils";
import { buildSettingsAuditColumns } from "@/frontend/common/views/dashboard/settings/utils/settingsAuditColumns";
import { SettingsAuditTabMobileView } from "@/frontend/mobile/views/dashboard/settings/tabs/audit/settingsAuditTab.mobile";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";
const settingsLabels = readTranslation(Translation.Dashboard.Settings, locale);
const adminLabels = readTranslation(Translation.Dashboard.Admin, locale);
const auditLabels = buildSettingsAuditLabels(settingsLabels.audit);

function makeRow(overrides: Partial<SettingsAuditRow> = {}): SettingsAuditRow {
  return {
    id: "audit-1",
    createdAt: "2025-01-01 10:00",
    entityType: "SYSTEM_SETTING",
    action: "UPDATE",
    description: "Updated session booking duration",
    actorUserId: "user-1",
    entityId: "setting-1",
    ...overrides,
  };
}

const NOOP = () => {};

function buildViewModel(overrides: Partial<SettingsAuditViewModel> = {}): SettingsAuditViewModel {
  return {
    labels: auditLabels,
    rows: [makeRow()],
    columns: buildSettingsAuditColumns(auditLabels.columns),
    page: 0,
    pageSize: 25,
    totalCount: 50,
    loading: false,
    entityType: "",
    action: "",
    fromDate: "",
    toDate: "",
    entityTypeOptions: [],
    actionOptions: [],
    onEntityTypeChange: NOOP,
    onActionChange: NOOP,
    onDateRangeChange: NOOP,
    onPageChange: NOOP,
    ...overrides,
  };
}

function renderTab(viewModel: SettingsAuditViewModel) {
  return renderWithWrapper(<SettingsAuditTabMobileView {...viewModel} />, { locale });
}

describe("SettingsAuditTab mobile view", () => {
  test("renders rows as cards without the desktop data grid", async () => {
    const { container } = renderTab(buildViewModel());

    const entityType = await screen.findByText("SYSTEM_SETTING");
    expect(entityType).toBeInTheDocument();
    const card = entityType.closest(".MuiPaper-root");
    expect(card?.textContent).toContain(`${auditLabels.columns.description}: Updated session booking duration`);
    expect(container.querySelector(".MuiDataGrid-root")).toBeNull();
  });

  test("shows the translated empty message when there are no rows", () => {
    renderTab(buildViewModel({ rows: [], totalCount: 0 }));

    expect(screen.getByText(auditLabels.emptyMessage)).toBeInTheDocument();
  });

  test("renders a server-mode pager and propagates onPageChange", async () => {
    const onPageChange = mock(() => {});
    renderTab(buildViewModel({ onPageChange }));

    await screen.findByText("SYSTEM_SETTING");
    expect(screen.getByText(adminLabels.paginationRange(1, 25, 50))).toBeInTheDocument();
    expect(screen.getByLabelText(adminLabels.goToPage)).toBeInTheDocument();

    const nextButton = screen.getByLabelText(adminLabels.nextPage).querySelector("button");
    expect(nextButton).not.toBeNull();
    if (nextButton) {
      fireEvent.click(nextButton);
    }
    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});

import { afterEach, describe, expect, mock, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

await mockNextNavigation("/dashboard", { locale: "ar", routingIncludeReplaceAndPrefetch: false });

await mock.module("next/link", () => ({
  default: ({
    children,
    href,
    prefetch: _prefetch,
    replace: _replace,
    scroll: _scroll,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    prefetch?: boolean;
    replace?: boolean;
    scroll?: boolean;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent } from "@testing-library/react";

expect.extend(matchers);

import type {
  ParentDirectoryRow,
  ParentsDataGridLabels,
} from "@/frontend/common/views/dashboard/admin/parents/home/ParentsViewTypes";
import { ParentsDataGridDesktop } from "@/frontend/desktop/views/dashboard/admin/parents/home/components/parentsDataGrid.desktop";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

const locale: AppLocale = "ar";
const adminLabels = readTranslation(Translation.Dashboard.Admin, locale);

const labels: ParentsDataGridLabels = {
  index: "Custom index",
  image: "Custom image",
  name: "Custom name column",
  email: "Custom email",
  time: "Custom time",
  status: "Custom status",
  accountStatus: "Custom account",
  unpaidInvoices: "Custom unpaid",
  options: "Custom options",
  noEntries: "Custom empty message",
  statusLabels: {
    regular: "Custom regular",
    on_leave: "Custom on leave",
    suspended: "Custom suspended",
    on_trial: "Custom on trial",
  },
  accountStatusLabels: {
    activated: "Custom activated",
    deactivated: "Custom deactivated",
  },
  manageLifecycle: "Custom manage lifecycle",
};

function makeRow(index: number): ParentDirectoryRow {
  return {
    id: `parent-${index}`,
    userId: "",
    index,
    name: `Parent Number ${index}`,
    email: `parent-${index}@example.com`,
    guardianOf: "Example Student",
    time: "09:00",
    lifecycleStatus: "regular",
    accountStatus: "activated",
    unpaidInvoices: 0,
  };
}

function makeRows(count: number): ParentDirectoryRow[] {
  return Array.from({ length: count }, (_, i) => makeRow(i + 1));
}

describe("ParentsDataGridDesktop pagination", () => {
  test("uses server pagination when totalCount and onPageChange are provided", () => {
    const onPageChange = mock((page: number) => page);
    const view = renderWithWrapper(
      <ParentsDataGridDesktop
        rows={makeRows(12)}
        labels={labels}
        onOpenSettings={() => undefined}
        page={0}
        pageSize={10}
        totalCount={100}
        onPageChange={onPageChange}
        canParentManageStatus={false}
      />,
      { locale }
    );

    // Server mode does not slice the handed rows: all 12 render on page 0.
    expect(view.getByText("Parent Number 12")).toBeInTheDocument();

    const nextWrapper = view.getByLabelText(adminLabels.nextPage);
    const nextButton = nextWrapper.querySelector("button");
    expect(nextButton).not.toBeNull();
    if (nextButton) {
      fireEvent.click(nextButton);
    }
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  test("falls back to client pagination when totalCount and onPageChange are omitted", () => {
    const view = renderWithWrapper(
      <ParentsDataGridDesktop
        rows={makeRows(12)}
        labels={labels}
        onOpenSettings={() => undefined}
        canParentManageStatus={false}
      />,
      { locale }
    );

    expect(view.getByText("Parent Number 10")).toBeInTheDocument();
    expect(view.queryByText("Parent Number 12")).not.toBeInTheDocument();

    const nextWrapper = view.getByLabelText(adminLabels.nextPage);
    const nextButton = nextWrapper.querySelector("button");
    expect(nextButton).not.toBeNull();
    if (nextButton) {
      fireEvent.click(nextButton);
    }

    expect(view.getByText("Parent Number 12")).toBeInTheDocument();
    expect(view.queryByText("Parent Number 1")).not.toBeInTheDocument();
  });
});

import { afterEach, describe, expect, mock, test } from "bun:test";
import type { MockLink } from "@apollo/client/testing";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import type { ExpenseQuery_expense } from "@/frontend/common/graphql/generated/gql/graphql";
import type { AppLocale } from "@/shared/locale/AppLocale";

// This suite lives next to the component it covers, so the happydom preloads
// wired into the shared component-test runner never load on this path. The DOM
// is registered first and every module that touches `document` at import time
// (testing-library above all) is imported dynamically afterwards, keeping the
// file runnable through the standard single-file test runner.
GlobalRegistrator.register();

const { configure: configureRtl, cleanup, fireEvent, screen, waitFor } = await import("@testing-library/react");
configureRtl({ asyncUtilTimeout: 5000 });

// Imported dynamically (it pulls in @testing-library/dom, which must first see
// the registered global document) and destructured to drop the interop
// `default` key: expect.extend types reject it while the named matchers pass.
const { default: _jestDomDefault, ...jestDomMatchers } = await import("@testing-library/jest-dom/matchers");
expect.extend(jestDomMatchers);

// The drawer navigates to the carryover deep link through next/navigation; the
// shared push mock records the provenance target for assertions.
const routerPush = mock((_href: string) => {});
const { mockNextNavigation } = await import("@/test/ui/components/helpers/mockNavigation");
await mockNextNavigation("/accounting/expenses/expense-1", { includeI18nMocks: false, mockPush: routerPush });

const { CurrencyCode, ExpenseType } = await import("@/frontend/common/graphql/generated/gql/graphql");
const { expenseQueryDocument } = await import("@/frontend/common/graphql/sharedDocuments");
const { EXPENSE_SOURCE_CARRYOVER_BALANCES } = await import("@/shared/constants/expenses");
const { readTranslation } = await import("@/shared/locale/client/translation-cache-store");
const { DashboardAccountingExpenses } = await import("@/shared/locale/namespaces");
const { Translation } = await import("@/shared/locale/namespaces/translation");
const { renderWithWrapper } = await import("@/test/ui/components/TestWrapper");
const { run: runAxe } = await import("axe-core");
const { ExpenseDetailDrawer } = await import(
  "@/frontend/common/views/dashboard/accounting/expenses/ExpenseDetailDrawer"
);

const locale: AppLocale = "en";

/** Resolves a lazy namespace warm-up: readTranslation throws its pending
 * promise on a cache miss, which must be awaited before the read resolves. */
async function warmNamespace(warm: () => void): Promise<void> {
  try {
    warm();
  } catch (thrown) {
    if (thrown instanceof Promise) await thrown;
  }
}

// Warm the lazy-loaded namespaces so component renders resolve translations
// synchronously instead of suspending on an unresolved promise.
await Promise.all([
  warmNamespace(() => readTranslation(DashboardAccountingExpenses, locale)),
  warmNamespace(() => readTranslation(Translation.Common, locale)),
]);
const labels = readTranslation(DashboardAccountingExpenses, locale);
const commonLabels = readTranslation(Translation.Common, locale);

const EXPENSE: ExpenseQuery_expense = {
  id: "expense-1",
  title: "Office rent",
  type: ExpenseType.Marketing,
  expenseValue: "15000.00",
  expenseCurrency: CurrencyCode.Egp,
  paymentDate: "2026-08-05",
  expenseDate: "2026-08",
  teacherId: "teacher-1",
  teacherName: "Karim Mansour",
  note: "August rent",
  sourceEntity: null,
  sourceEntityId: null,
  createdByUserId: "user-1",
  createdByName: "Mariam Adel",
  createdAt: "2026-08-05T10:00:00.000Z",
  updatedAt: "2026-08-06T10:00:00.000Z",
  deletedAt: null,
  deletedByUserId: null,
  deletedReason: null,
};

const DELETED_EXPENSE: ExpenseQuery_expense = {
  ...EXPENSE,
  deletedAt: "2026-08-20T12:30:00.000Z",
  deletedByUserId: "user-9",
  deletedReason: "Duplicate entry",
};

const CARRYOVER_SOURCED_EXPENSE: ExpenseQuery_expense = {
  ...EXPENSE,
  id: "expense-2",
  title: "Karim carryover payout",
  type: ExpenseType.Salaries,
  sourceEntity: EXPENSE_SOURCE_CARRYOVER_BALANCES,
  sourceEntityId: "carryover-9",
};

function expenseMock(expense: ExpenseQuery_expense): MockLink.MockedResponse {
  return {
    request: { query: expenseQueryDocument, variables: { id: expense.id ?? "" } },
    result: { data: { expense } },
    maxUsageCount: Number.POSITIVE_INFINITY,
  };
}

function expenseErrorMock(id: string): MockLink.MockedResponse {
  return {
    request: { query: expenseQueryDocument, variables: { id } },
    error: new Error("transport down"),
  };
}

const onClose = mock(() => {});

function renderDrawer(options: {
  readonly expenseId: string;
  readonly mocks: MockLink.MockedResponse[];
  readonly open?: boolean;
}) {
  return renderWithWrapper(
    <ExpenseDetailDrawer expenseId={options.expenseId} open={options.open ?? true} onClose={onClose} />,
    { locale, mocks: options.mocks }
  );
}

// Happy DOM cannot compute visual styles, so the color-contrast rule stays
// incomplete there; it is excluded and contrast is covered by the theme tokens.
async function expectNoAxeViolations(container: HTMLElement): Promise<void> {
  const results = await runAxe(container, { rules: { "color-contrast": { enabled: false } } });
  expect(results.violations).toEqual([]);
}

afterEach(() => {
  cleanup();
  onClose.mockClear();
  routerPush.mockClear();
});

describe("ExpenseDetailDrawer (component)", () => {
  test("renders the detail summary with the type and provenance chips", async () => {
    const { container } = renderDrawer({ expenseId: "expense-1", mocks: [expenseMock(EXPENSE)] });

    expect(await screen.findByText(labels.drawer.title(EXPENSE.title ?? ""))).toBeInTheDocument();
    expect(screen.getByText(labels.type.Marketing)).toBeInTheDocument();
    expect(screen.getByText(EXPENSE.teacherName ?? "")).toBeInTheDocument();
    expect(screen.getByText(EXPENSE.paymentDate ?? "")).toBeInTheDocument();
    expect(screen.getByText(EXPENSE.expenseDate ?? "")).toBeInTheDocument();
    expect(screen.getByText(EXPENSE.createdByName ?? "")).toBeInTheDocument();
    expect(screen.getByText(EXPENSE.note ?? "")).toBeInTheDocument();
    // A manual row renders the neutral, non-navigating source chip.
    expect(screen.getByLabelText(labels.source.Manual)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: labels.source.Manual })).toBeNull();
    // Nothing about deletion shows on a live record.
    expect(screen.queryByText(labels.drawer.deletedBanner)).toBeNull();
    await expectNoAxeViolations(container);
  });

  test("shows the deleted banner with the timestamp and reason on a soft-deleted record", async () => {
    renderDrawer({ expenseId: "expense-1", mocks: [expenseMock(DELETED_EXPENSE)] });

    const banner = await screen.findByText(labels.drawer.deletedBanner);
    expect(banner.closest('[class*="MuiAlert-colorWarning"]')).not.toBeNull();
    expect(screen.getByText(content => content.startsWith(labels.drawer.deletedAt))).toBeInTheDocument();
    expect(
      screen.getByText(content => content.includes(`${labels.drawer.deletionReason}: ${DELETED_EXPENSE.deletedReason}`))
    ).toBeInTheDocument();
  });

  test("the carryover provenance chip navigates to the carryover deep link", async () => {
    renderDrawer({ expenseId: "expense-2", mocks: [expenseMock(CARRYOVER_SOURCED_EXPENSE)] });

    const chip = await screen.findByRole("button", { name: labels.source.FromCarryover });
    fireEvent.click(chip);

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith("/accounting/carryover/carryover-9");
    });
  });

  test("surfaces the translated error state when the detail query fails", async () => {
    renderDrawer({ expenseId: "expense-1", mocks: [expenseErrorMock("expense-1")] });

    expect(await screen.findByText(labels.loadError)).toBeInTheDocument();
  });

  test("the close button requests the drawer close", async () => {
    renderDrawer({ expenseId: "expense-1", mocks: [expenseMock(EXPENSE)] });

    fireEvent.click(await screen.findByRole("button", { name: commonLabels.ariaClose }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  test("a closed drawer renders nothing and skips the query", () => {
    renderDrawer({ expenseId: "expense-1", open: false, mocks: [] });

    expect(screen.queryByRole("button", { name: commonLabels.ariaClose })).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });
});

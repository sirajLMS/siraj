import { afterEach, describe, expect, mock, test } from "bun:test";
import type { MockLink } from "@apollo/client/testing";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import type { DocumentNode, GraphQLError as GraphQLErrorType } from "graphql";
import type { AppLocale } from "@/shared/locale/AppLocale";

// This suite lives next to the components it covers, so the happydom preloads
// wired into the shared component-test runner never load on this path. The DOM
// is registered first and every module that touches `document` at import time
// (testing-library above all) is imported dynamically afterwards, keeping the
// file runnable through the standard single-file test runner.
GlobalRegistrator.register();

const { configure: configureRtl, cleanup, fireEvent, screen, waitFor, within } = await import("@testing-library/react");
configureRtl({ asyncUtilTimeout: 5000 });

// Imported dynamically (it pulls in @testing-library/dom, which must first see
// the registered global document) and destructured to drop the interop
// `default` key: expect.extend types reject it while the named matchers pass.
const { default: _jestDomDefault, ...jestDomMatchers } = await import("@testing-library/jest-dom/matchers");
expect.extend(jestDomMatchers);

// The toast host needs a Toolpad provider chain the test wrapper does not set
// up; the dialogs only call `show`, so a minimal hook mock is enough.
const showNotification = mock((_message: string, _options?: unknown) => {});
await mock.module("@toolpad/core/useNotifications", () => ({
  useNotifications: () => ({ show: showNotification }),
}));

const { GraphQLError } = await import("graphql");
const { CurrencyCode } = await import("@/frontend/common/graphql/generated/gql/graphql");
const { bulkDeleteExpensesMutationDocument, deleteExpenseMutationDocument } = await import(
  "@/frontend/common/graphql/sharedDocuments"
);
const { readTranslation } = await import("@/shared/locale/client/translation-cache-store");
const { DashboardAccountingExpenses } = await import("@/shared/locale/namespaces");
const { Translation } = await import("@/shared/locale/namespaces/translation");
const { formatAccountingMoney } = await import("@/frontend/common/views/dashboard/accounting/accountingFormatters");
const { renderWithWrapper } = await import("@/test/ui/components/TestWrapper");
const { run: runAxe } = await import("axe-core");
const { DeleteExpenseDialog } = await import(
  "@/frontend/common/views/dashboard/accounting/expenses/DeleteExpenseDialog"
);
const { BulkDeleteExpensesDialog } = await import(
  "@/frontend/common/views/dashboard/accounting/expenses/BulkDeleteExpensesDialog"
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

const ROW = { id: "expense-1", title: "Office rent", expenseValue: "800.00", expenseCurrency: CurrencyCode.Egp };
const ROW_2 = { id: "expense-2", title: "Facebook ads", expenseValue: "300.00", expenseCurrency: CurrencyCode.Usd };
const BULK_IDS = [ROW.id, ROW_2.id] as const;

/** Counts actual mutation invocations (`result` runs once per network call). */
let mutationCalls = 0;

/** Payload shape one served mutation response carries. */
interface CountedMockResult {
  readonly data: Record<string, unknown>;
  readonly errors?: GraphQLErrorType[];
}

/** One exact-match mutation mock that counts every network call it serves. */
function countedMutationMock(
  query: DocumentNode,
  variables: Record<string, unknown>,
  buildResult: () => CountedMockResult
): MockLink.MockedResponse {
  return {
    request: { query, variables },
    result: () => {
      mutationCalls += 1;
      return buildResult();
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  };
}

/** Server rejection on a mutation root field, optionally carrying a domain code. */
function failingMutationMock(
  query: DocumentNode,
  variables: Record<string, unknown>,
  rootField: string,
  message: string,
  code?: string
): MockLink.MockedResponse {
  return countedMutationMock(query, variables, () => ({
    data: { [rootField]: null },
    errors: [new GraphQLError(message, code === undefined ? {} : { extensions: { code } })],
  }));
}

/** Variables of the single-row delete; the reason is null unless the test typed one. */
function deleteVariables(reason: string | null): Record<string, unknown> {
  return { input: { id: ROW.id ?? "", reason } };
}

function deleteSuccessMock(reason: string | null = null): MockLink.MockedResponse {
  return countedMutationMock(deleteExpenseMutationDocument, deleteVariables(reason), () => ({
    data: { deleteExpense: { id: ROW.id, deleted: true } },
  }));
}

function deleteViaUnpayMock(): MockLink.MockedResponse {
  return failingMutationMock(
    deleteExpenseMutationDocument,
    deleteVariables(null),
    "deleteExpense",
    "Delete via the carryover Unpay flow instead",
    "EXPENSE_DELETE_VIA_UNPAY"
  );
}

function deleteGenericFailureMock(): MockLink.MockedResponse {
  return failingMutationMock(
    deleteExpenseMutationDocument,
    deleteVariables(null),
    "deleteExpense",
    "Ledger row is locked by an open period"
  );
}

/** Variables of the bulk delete over both fixture rows; a reason is never collected here. */
function bulkDeleteVariables(): Record<string, unknown> {
  return { input: { ids: [...BULK_IDS], reason: null } };
}

function bulkDeleteSuccessMock(): MockLink.MockedResponse {
  return countedMutationMock(bulkDeleteExpensesMutationDocument, bulkDeleteVariables(), () => ({
    data: {
      bulkDeleteExpenses: [
        { id: ROW.id, deleted: true, auditLogIds: ["audit-1"] },
        { id: ROW_2.id, deleted: true, auditLogIds: ["audit-2"] },
      ],
    },
  }));
}

function bulkDeleteViaUnpayMock(): MockLink.MockedResponse {
  return failingMutationMock(
    bulkDeleteExpensesMutationDocument,
    bulkDeleteVariables(),
    "bulkDeleteExpenses",
    "One expense is a paid carryover settlement",
    "EXPENSE_DELETE_VIA_UNPAY"
  );
}

const onClose = mock(() => {});
const onDone = mock(() => {});

function renderDelete(mocks: MockLink.MockedResponse[] = []) {
  return renderWithWrapper(<DeleteExpenseDialog open row={ROW} onClose={onClose} onDone={onDone} />, {
    locale,
    mocks,
  });
}

function renderBulkDelete(mocks: MockLink.MockedResponse[] = []) {
  return renderWithWrapper(<BulkDeleteExpensesDialog open rows={[ROW, ROW_2]} onClose={onClose} onDone={onDone} />, {
    locale,
    mocks,
  });
}

// Happy DOM cannot compute visual styles, so the color-contrast rule stays
// incomplete there; it is excluded and contrast is covered by the theme tokens.
async function expectNoAxeViolations(container: HTMLElement): Promise<void> {
  const results = await runAxe(container, { rules: { "color-contrast": { enabled: false } } });
  expect(results.violations).toEqual([]);
}

/** Both confirm dialogs guard the double-click path into a single network call. */
async function expectDoubleClickConfirmsOnce(confirmLabel: string) {
  const dialog = await screen.findByRole("dialog");
  const confirm = within(dialog).getByRole("button", { name: confirmLabel });
  fireEvent.click(confirm);
  fireEvent.click(confirm);
  await waitFor(() => {
    expect(mutationCalls).toBe(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
}

/** Cancel on either dialog closes it without issuing a mutation. */
async function expectCancelCloses(cancelLabel: string) {
  const dialog = await screen.findByRole("dialog");
  fireEvent.click(within(dialog).getByRole("button", { name: cancelLabel }));
  await waitFor(() => {
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  expect(mutationCalls).toBe(0);
}

/** Renders a confirm dialog and asserts axe has nothing to say about it. */
async function expectDialogAxeClean(renderDialogUnderTest: () => ReturnType<typeof renderDelete>) {
  const { container } = renderDialogUnderTest();
  expect(await screen.findByRole("dialog")).toBeInTheDocument();
  await expectNoAxeViolations(container);
}

afterEach(() => {
  cleanup();
  onClose.mockClear();
  onDone.mockClear();
  showNotification.mockClear();
  mutationCalls = 0;
});

describe("DeleteExpenseDialog (component)", () => {
  test("restates the expense summary and confirms the delete", async () => {
    renderDelete([deleteSuccessMock()]);

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText(
        labels.modal.delete.summary(ROW.title ?? "", formatAccountingMoney(ROW.expenseValue), ROW.expenseCurrency)
      )
    ).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: labels.modal.delete.confirm }));

    await waitFor(() => {
      expect(mutationCalls).toBe(1);
      expect(onDone).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    expect(showNotification).toHaveBeenCalledWith(labels.success.deleted, { severity: "success" });
  });

  test("sends the trimmed optional reason with the delete", async () => {
    renderDelete([deleteSuccessMock("Duplicate entry")]);

    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByRole("textbox", { name: labels.modal.delete.reason }), {
      target: { value: "  Duplicate entry  " },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: labels.modal.delete.confirm }));

    await waitFor(() => {
      expect(mutationCalls).toBe(1);
      expect(onDone).toHaveBeenCalledTimes(1);
    });
  });

  test("a double-clicked confirm fires exactly one mutation", async () => {
    renderDelete([deleteSuccessMock()]);

    await expectDoubleClickConfirmsOnce(labels.modal.delete.confirm);
  });

  test("EXPENSE_DELETE_VIA_UNPAY blocks the confirm with a persistent alert", async () => {
    renderDelete([deleteViaUnpayMock()]);

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: labels.modal.delete.confirm }));

    await waitFor(() => {
      expect(mutationCalls).toBe(1);
    });
    // The blocking banner explains the guard and cannot be dismissed from here.
    const banner = await screen.findByRole("alert");
    expect(banner.textContent).toContain(labels.error.deleteViaUnpay);
    // The destructive confirm and the reason field lock while the banner shows.
    expect(within(dialog).getByRole("button", { name: labels.modal.delete.confirm })).toBeDisabled();
    expect(within(dialog).getByRole("textbox", { name: labels.modal.delete.reason })).toBeDisabled();
    // Nothing toasted, nothing closed — the operator must use the Unpay flow.
    expect(showNotification).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  test("an ordinary rejection toasts the server message and stays open", async () => {
    renderDelete([deleteGenericFailureMock()]);

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: labels.modal.delete.confirm }));

    await waitFor(() => {
      expect(mutationCalls).toBe(1);
    });
    expect(showNotification).toHaveBeenCalledWith("Ledger row is locked by an open period", { severity: "error" });
    expect(screen.queryByRole("alert")).toBeNull();
    expect(onDone).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    // The guard re-arms so a retry stays possible within the same session.
    expect(within(dialog).getByRole("button", { name: labels.modal.delete.confirm })).toBeEnabled();
  });

  test("Cancel closes without a mutation", async () => {
    renderDelete();

    await expectCancelCloses(labels.modal.delete.cancel);
  });

  test("passes axe accessibility checks", async () => {
    await expectDialogAxeClean(renderDelete);
  });
});

describe("BulkDeleteExpensesDialog (component)", () => {
  test("restates every selected row and confirms the batch delete", async () => {
    renderBulkDelete([bulkDeleteSuccessMock()]);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(labels.modal.bulkDelete.title(BULK_IDS.length))).toBeInTheDocument();
    expect(within(dialog).getByText(ROW.title ?? "")).toBeInTheDocument();
    expect(within(dialog).getByText(ROW_2.title ?? "")).toBeInTheDocument();
    expect(
      within(dialog).getByText(`${formatAccountingMoney(ROW.expenseValue)} ${ROW.expenseCurrency}`)
    ).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: labels.modal.bulkDelete.confirm }));

    await waitFor(() => {
      expect(mutationCalls).toBe(1);
      expect(onDone).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    expect(showNotification).toHaveBeenCalledWith(labels.success.bulkDeleted(BULK_IDS.length), {
      severity: "success",
    });
  });

  test("a double-clicked confirm fires exactly one batch mutation", async () => {
    renderBulkDelete([bulkDeleteSuccessMock()]);

    await expectDoubleClickConfirmsOnce(labels.modal.bulkDelete.confirm);
  });

  test("a guarded row rejects the whole batch and toasts the server message", async () => {
    renderBulkDelete([bulkDeleteViaUnpayMock()]);

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: labels.modal.bulkDelete.confirm }));

    await waitFor(() => {
      expect(mutationCalls).toBe(1);
    });
    // The batch is atomic server-side: the failure surfaces as a toast and the
    // dialog stays open with nothing deleted.
    expect(showNotification).toHaveBeenCalledWith("One expense is a paid carryover settlement", {
      severity: "error",
    });
    expect(onDone).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  test("Cancel closes without a mutation", async () => {
    renderBulkDelete();

    await expectCancelCloses(labels.modal.bulkDelete.cancel);
  });

  test("passes axe accessibility checks", async () => {
    await expectDialogAxeClean(renderBulkDelete);
  });
});

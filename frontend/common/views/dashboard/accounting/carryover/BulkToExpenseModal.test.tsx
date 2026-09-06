import { afterAll, afterEach, beforeAll, describe, expect, mock, test } from "bun:test";
import type { MockLink } from "@apollo/client/testing";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import type { BulkToExpenseInput } from "@/frontend/common/graphql/generated/gql/graphql";
import type { BulkToExpenseRow } from "@/frontend/common/views/dashboard/accounting/carryover/BulkToExpenseModal";
import type { AppLocale } from "@/shared/locale/AppLocale";

// This suite lives next to the component it covers, so the happydom preloads
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
// up; the modal only calls `show`, so a minimal hook mock is enough.
const showNotification = mock((_message: string, _options?: unknown) => {});
await mock.module("@toolpad/core/useNotifications", () => ({
  useNotifications: () => ({ show: showNotification }),
}));

const { GraphQLError } = await import("graphql");
const { CurrencyCode } = await import("@/frontend/common/graphql/generated/gql/graphql");
const { bulkCarryoverToExpenseMutationDocument } = await import("@/frontend/common/graphql/sharedDocuments");
const { useTheme } = await import("@mui/material/styles");
const { readTranslation } = await import("@/shared/locale/client/translation-cache-store");
const { DashboardAccountingCarryover } = await import("@/shared/locale/namespaces");
const { Translation } = await import("@/shared/locale/namespaces/translation");
const { renderWithWrapper } = await import("@/test/ui/components/TestWrapper");
const { run: runAxe } = await import("axe-core");
const { BulkToExpenseModal } = await import(
  "@/frontend/common/views/dashboard/accounting/carryover/BulkToExpenseModal"
);

const locale: AppLocale = "en";
const rtlLocale: AppLocale = "ar";

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
// synchronously instead of suspending on an unresolved promise. Both locales
// are warmed: the right-to-left suite renders the same modal in Arabic.
await Promise.all([
  warmNamespace(() => readTranslation(DashboardAccountingCarryover, locale)),
  warmNamespace(() => readTranslation(Translation.Common, locale)),
  warmNamespace(() => readTranslation(DashboardAccountingCarryover, rtlLocale)),
  warmNamespace(() => readTranslation(Translation.Common, rtlLocale)),
]);
const labels = readTranslation(DashboardAccountingCarryover, locale);
const labelsAr = readTranslation(DashboardAccountingCarryover, rtlLocale);
const commonLabelsAr = readTranslation(Translation.Common, rtlLocale);

// The modal mints one idempotency token per open session; pinning the token
// keeps the mutation variables deterministic so the Apollo mocks match exactly.
const FIXED_CLIENT_REQUEST_ID: `${string}-${string}-${string}-${string}-${string}` =
  "carryover-bulk-expense-fixed-request-id";
const originalRandomUUID: typeof crypto.randomUUID = crypto.randomUUID;

beforeAll(() => {
  // Explicit return type keeps the template-literal type from widening to
  // `string`, which the overloaded randomUUID property type rejects.
  crypto.randomUUID = (): `${string}-${string}-${string}-${string}-${string}` => FIXED_CLIENT_REQUEST_ID;
});

afterAll(() => {
  crypto.randomUUID = originalRandomUUID;
});

const SELECTED_IDS = ["carryover-1", "carryover-2"];

const SELECTED_ROWS: BulkToExpenseRow[] = [
  { id: "carryover-1", payable: "100.00", teacherCurrency: CurrencyCode.Egp },
  { id: "carryover-2", payable: "250.50", teacherCurrency: CurrencyCode.Egp },
];

/** Not part of the selection: proves the summary counts and totals the selected rows only. */
const UNSELECTED_ROW: BulkToExpenseRow = {
  id: "carryover-3",
  payable: "999.99",
  teacherCurrency: CurrencyCode.Usd,
};

const ALL_ROWS: BulkToExpenseRow[] = [...SELECTED_ROWS, UNSELECTED_ROW];

/** Matches the modal's own summary formatting (locale-aware, always 2 decimals). */
function formatAmount(total: number, amountLocale: AppLocale): string {
  return new Intl.NumberFormat(amountLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(total);
}

const SELECTED_TOTAL = 100 + 250.5;

// Typed "09/05/2026" in the en picker resolves to a local-midnight Date, so the
// wire strings stay stable in any timezone.
const BULK_INPUT: BulkToExpenseInput = {
  carryoverIds: [...SELECTED_IDS],
  paymentDate: "2026-09-05",
  expenseDate: "2026-09",
  note: null,
  clientRequestId: FIXED_CLIENT_REQUEST_ID,
};

/** Counts actual mutation invocations (`result` runs once per network call). */
let mutationCalls = 0;

function successfulBulkMock(): MockLink.MockedResponse {
  return {
    request: { query: bulkCarryoverToExpenseMutationDocument, variables: { input: BULK_INPUT } },
    result: () => {
      mutationCalls += 1;
      return { data: { bulkCarryoverToExpense: { id: "bulk-to-expense-1", auditLogIds: [], items: [] } } };
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  };
}

function domainErrorMock(code: string, message: string): MockLink.MockedResponse {
  return {
    request: { query: bulkCarryoverToExpenseMutationDocument, variables: { input: BULK_INPUT } },
    result: () => {
      mutationCalls += 1;
      return {
        data: { bulkCarryoverToExpense: null },
        errors: [new GraphQLError(message, { extensions: { code } })],
      };
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  };
}

const onClose = mock(() => {});
const onDone = mock(() => {});

interface ModalRenderOptions {
  readonly mocks?: MockLink.MockedResponse[];
  readonly locale?: AppLocale;
}

function renderModal(options: ModalRenderOptions = {}) {
  return renderWithWrapper(
    <BulkToExpenseModal open carryoverIds={SELECTED_IDS} rows={ALL_ROWS} onClose={onClose} onDone={onDone} />,
    { locale: options.locale ?? locale, mocks: options.mocks ?? [] }
  );
}

function submitButton() {
  return screen.getByRole("button", { name: labels.modal.bulkToExpense.submit });
}

/** Types a payment date; the picker pre-seeds the still-empty expense month. */
function pickPaymentDate(dialog: HTMLElement) {
  fireEvent.change(within(dialog).getByRole("textbox", { name: labels.modal.bulkToExpense.paymentDate }), {
    target: { value: "09/05/2026" },
  });
}

// Happy DOM cannot compute visual styles, so the color-contrast rule stays
// incomplete there; it is excluded and contrast is covered by the theme tokens.
async function expectNoAxeViolations(container: HTMLElement): Promise<void> {
  const results = await runAxe(container, { rules: { "color-contrast": { enabled: false } } });
  expect(results.violations).toEqual([]);
}

/** Exposes the active MUI theme direction so right-to-left renders can assert it. */
function ThemeDirectionProbe() {
  const theme = useTheme();
  return <span data-testid="theme-direction">{theme.direction}</span>;
}

afterEach(() => {
  cleanup();
  onClose.mockClear();
  onDone.mockClear();
  showNotification.mockClear();
  mutationCalls = 0;
});

describe("BulkToExpenseModal (component)", () => {
  test("summarizes the selection and keeps submit disabled until dates are set", async () => {
    renderModal();

    const dialog = await screen.findByRole("dialog");
    // Count, formatted total, and dominant currency of the two selected rows.
    const summary = labels.modal.bulkToExpense.summary(
      SELECTED_IDS.length,
      formatAmount(SELECTED_TOTAL, locale),
      CurrencyCode.Egp
    );
    expect(within(dialog).getByText(summary)).toBeInTheDocument();
    // Both pickers are required; without dates the conversion cannot submit.
    expect(within(dialog).getByRole("textbox", { name: labels.modal.bulkToExpense.paymentDate })).toBeInTheDocument();
    expect(within(dialog).getByRole("textbox", { name: labels.modal.bulkToExpense.expenseDate })).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
  });

  test("converts the selection with the exact mutation input and success toast", async () => {
    renderModal({ mocks: [successfulBulkMock()] });

    const dialog = await screen.findByRole("dialog");
    pickPaymentDate(dialog);
    // The payment date pre-seeds the still-empty expense month, unlocking submit.
    await waitFor(() => {
      expect(submitButton()).toBeEnabled();
    });

    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(mutationCalls).toBe(1);
      expect(onDone).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    expect(showNotification).toHaveBeenCalledWith(labels.success.bulkedToExpense(SELECTED_IDS.length), {
      severity: "success",
    });
  });

  test("a double-clicked submit fires exactly one mutation", async () => {
    renderModal({ mocks: [successfulBulkMock()] });

    const dialog = await screen.findByRole("dialog");
    pickPaymentDate(dialog);
    await waitFor(() => {
      expect(submitButton()).toBeEnabled();
    });
    const submit = submitButton();
    fireEvent.click(submit);
    fireEvent.click(submit);

    await waitFor(() => {
      expect(mutationCalls).toBe(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  test("CARRYOVER_ALREADY_PAID renders a non-dismissible banner and keeps the dialog open", async () => {
    renderModal({ mocks: [domainErrorMock("CARRYOVER_ALREADY_PAID", "Already paid")] });

    const dialog = await screen.findByRole("dialog");
    pickPaymentDate(dialog);
    await waitFor(() => {
      expect(submitButton()).toBeEnabled();
    });
    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(mutationCalls).toBe(1);
    });
    const banner = await screen.findByRole("alert");
    expect(banner).toHaveTextContent(labels.error.alreadyPaid);
    // No dismiss affordance, the dialog stays open, and the same selection can
    // never succeed — the submit stays disabled for the rest of the session.
    expect(within(banner).queryByRole("button")).toBeNull();
    expect(submitButton()).toBeDisabled();
    expect(onClose).not.toHaveBeenCalled();
    expect(showNotification).not.toHaveBeenCalled();
  });

  test("a rejected attempt re-arms the idempotency token so the retry succeeds", async () => {
    renderModal({
      mocks: [domainErrorMock("SERVICE_UNAVAILABLE", "Provider hiccup"), successfulBulkMock()],
    });

    const dialog = await screen.findByRole("dialog");
    pickPaymentDate(dialog);
    await waitFor(() => {
      expect(submitButton()).toBeEnabled();
    });
    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(mutationCalls).toBe(1);
      expect(showNotification).toHaveBeenCalledWith("Provider hiccup", { severity: "error" });
    });
    expect(onClose).not.toHaveBeenCalled();

    // The retry reuses the pinned per-session token: the success mock is the
    // exact same variables, so a token change would fail to match the mock.
    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(mutationCalls).toBe(2);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    expect(showNotification).toHaveBeenCalledWith(labels.success.bulkedToExpense(SELECTED_IDS.length), {
      severity: "success",
    });
  });

  test("passes axe accessibility checks in the default state", async () => {
    const { container } = renderModal();

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});

// Right-to-left expectation block: Happy DOM cannot take visual snapshots, so
// the RTL contract is pinned structurally instead — Arabic strings across every
// modal surface, the rtl theme direction, and a clean axe pass.
describe("BulkToExpenseModal right-to-left (component)", () => {
  test("renders the modal surfaces with Arabic labels", async () => {
    renderModal({ locale: rtlLocale });

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(labelsAr.modal.bulkToExpense.title)).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        labelsAr.modal.bulkToExpense.summary(
          SELECTED_IDS.length,
          formatAmount(SELECTED_TOTAL, rtlLocale),
          CurrencyCode.Egp
        )
      )
    ).toBeInTheDocument();
    expect(within(dialog).getByRole("textbox", { name: labelsAr.modal.bulkToExpense.paymentDate })).toBeInTheDocument();
    expect(within(dialog).getByRole("textbox", { name: labelsAr.modal.bulkToExpense.expenseDate })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: labelsAr.modal.bulkToExpense.submit })).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: labelsAr.modal.bulkToExpense.cancel })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: commonLabelsAr.ariaClose })).toBeInTheDocument();
  });

  test("applies the right-to-left theme direction for the Arabic locale", async () => {
    renderWithWrapper(
      <>
        <ThemeDirectionProbe />
        <BulkToExpenseModal open carryoverIds={SELECTED_IDS} rows={ALL_ROWS} onClose={onClose} onDone={onDone} />
      </>,
      { locale: rtlLocale, mocks: [] }
    );

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByTestId("theme-direction")).toHaveTextContent("rtl");
  });

  test("passes axe accessibility checks under the Arabic right-to-left locale", async () => {
    const { container } = renderModal({ locale: rtlLocale });

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});

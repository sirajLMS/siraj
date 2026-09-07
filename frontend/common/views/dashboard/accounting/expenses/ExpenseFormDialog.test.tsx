import { afterAll, afterEach, beforeAll, describe, expect, mock, test } from "bun:test";
import type { MockLink } from "@apollo/client/testing";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import type { DocumentNode, GraphQLError as GraphQLErrorType } from "graphql";
import type { CreateExpenseInput, UpdateExpenseInput } from "@/frontend/common/graphql/generated/gql/graphql";
import type { ExpenseFormRow } from "@/frontend/common/views/dashboard/accounting/expenses/useExpenseFormViewModel";
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
// up; the dialog only calls `show`, so a minimal hook mock is enough.
const showNotification = mock((_message: string, _options?: unknown) => {});
await mock.module("@toolpad/core/useNotifications", () => ({
  useNotifications: () => ({ show: showNotification }),
}));

const { GraphQLError } = await import("graphql");
const { CurrencyCode, ExpenseType } = await import("@/frontend/common/graphql/generated/gql/graphql");
const { createExpenseMutationDocument, teachersQueryDocument, updateExpenseMutationDocument } = await import(
  "@/frontend/common/graphql/sharedDocuments"
);
const { readTranslation } = await import("@/shared/locale/client/translation-cache-store");
const { DashboardAccountingExpenses } = await import("@/shared/locale/namespaces");
const { Translation } = await import("@/shared/locale/namespaces/translation");
const { USER_SELECT_LIMIT } = await import("@/frontend/common/components/ui/input/userSelect");
const { formatDateInput, parseDateInput } = await import("@/frontend/common/components/intl/dateFormat");
const { useUserAutocompleteStore } = await import("@/frontend/common/stores/userAutocompleteStore");
const { renderWithWrapper } = await import("@/test/ui/components/TestWrapper");
const { run: runAxe } = await import("axe-core");
const { ExpenseFormDialog } = await import("@/frontend/common/views/dashboard/accounting/expenses/ExpenseFormDialog");

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
  warmNamespace(() => readTranslation(Translation.Ui.UserSelect, locale)),
]);
const labels = readTranslation(DashboardAccountingExpenses, locale);

// The dialog mints one idempotency token per open session; pinning the token
// keeps the mutation variables deterministic so the Apollo mocks match exactly.
const FIXED_CLIENT_REQUEST_ID: `${string}-${string}-${string}-${string}-${string}` = "expense-form-fixed-request-id";
const originalRandomUUID: typeof crypto.randomUUID = crypto.randomUUID;

beforeAll(() => {
  // Explicit return type keeps the template-literal type from widening to
  // `string`, which the overloaded randomUUID property type rejects.
  crypto.randomUUID = (): `${string}-${string}-${string}-${string}-${string}` => FIXED_CLIENT_REQUEST_ID;
});

afterAll(() => {
  crypto.randomUUID = originalRandomUUID;
});

const TEACHER = { id: "teacher-1", name: "Karim Mansour", avatarUrl: null };

const EDIT_ROW: ExpenseFormRow = {
  id: "expense-1",
  title: "Marketing flyers",
  type: ExpenseType.Marketing,
  teacherId: TEACHER.id,
  teacherName: TEACHER.name,
  expenseValue: "125.50",
  expenseCurrency: CurrencyCode.Egp,
  paymentDate: "2026-08-05",
  expenseDate: "2026-08",
  note: "Print run",
};

const SALARIES_ROW: ExpenseFormRow = {
  id: "expense-9",
  title: "Sara salary payout",
  type: ExpenseType.Salaries,
  teacherId: "teacher-2",
  teacherName: "Sara Adel",
  expenseValue: "4500.00",
  expenseCurrency: CurrencyCode.Egp,
  paymentDate: "2026-08-25",
  expenseDate: "2026-08",
  note: "Carryover payout",
};

const CREATE_INPUT: CreateExpenseInput = {
  title: "Office rent",
  type: ExpenseType.Marketing,
  teacherId: TEACHER.id,
  expenseValue: "1250",
  expenseCurrency: CurrencyCode.Egp,
  paymentDate: "2026-09-01",
  expenseDate: "2026-09",
  note: "September rent",
  clientRequestId: FIXED_CLIENT_REQUEST_ID,
};

// The edit patch mirrors the seeded row; the date fields go through the same
// input helpers the view model uses so the expectation is timezone-agnostic.
const UPDATE_INPUT: UpdateExpenseInput = {
  id: EDIT_ROW.id ?? "",
  title: EDIT_ROW.title ?? "",
  expenseValue: EDIT_ROW.expenseValue ?? "",
  expenseCurrency: CurrencyCode.Egp,
  paymentDate: formatDateInput(parseDateInput(EDIT_ROW.paymentDate)),
  expenseDate: EDIT_ROW.expenseDate ?? "",
  note: EDIT_ROW.note,
  type: EDIT_ROW.type,
  teacherId: TEACHER.id,
  teacherName: TEACHER.name,
};

// A Salaries row is system-settled: type and value stay off the patch entirely.
const SALARIES_UPDATE_INPUT: UpdateExpenseInput = {
  id: SALARIES_ROW.id ?? "",
  title: SALARIES_ROW.title ?? "",
  expenseCurrency: CurrencyCode.Egp,
  paymentDate: formatDateInput(parseDateInput(SALARIES_ROW.paymentDate)),
  expenseDate: SALARIES_ROW.expenseDate ?? "",
  note: SALARIES_ROW.note,
  type: null,
  expenseValue: null,
  teacherId: SALARIES_ROW.teacherId,
  teacherName: SALARIES_ROW.teacherName,
};

/** Counts actual mutation invocations (`result` runs once per network call). */
let mutationCalls = 0;

/** The teacher autocomplete queries on mount; an empty-search page keeps it calm. */
function teachersMock(search = ""): MockLink.MockedResponse {
  return {
    request: { query: teachersQueryDocument, variables: { search, limit: USER_SELECT_LIMIT } },
    result: {
      data: {
        teachers: [{ __typename: "TeacherSimple", id: TEACHER.id, name: TEACHER.name, avatarUrl: null }],
      },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  };
}

/** Full ExpenseFields payload returned by the write mutations. */
function expensePayload(id: string) {
  return {
    id,
    title: "Office rent",
    type: ExpenseType.Marketing,
    expenseValue: "1250.00",
    expenseCurrency: CurrencyCode.Egp,
    paymentDate: "2026-09-01",
    expenseDate: "2026-09",
    teacherId: TEACHER.id,
    teacherName: TEACHER.name,
    note: "September rent",
    sourceEntity: null,
    sourceEntityId: null,
    createdByUserId: "user-1",
    createdByName: "Mariam Adel",
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
    deletedAt: null,
    deletedByUserId: null,
    deletedReason: null,
  };
}

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

/** Server rejection on a write mutation, carrying the domain code the form maps inline. */
function failingExpenseMutationMock(
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

function successfulCreateMock(): MockLink.MockedResponse {
  return countedMutationMock(createExpenseMutationDocument, { input: CREATE_INPUT }, () => ({
    data: { createExpense: expensePayload("expense-new-1") },
  }));
}

function successfulUpdateMock(input: UpdateExpenseInput = UPDATE_INPUT): MockLink.MockedResponse {
  return countedMutationMock(updateExpenseMutationDocument, { input }, () => ({
    data: { updateExpense: expensePayload(String(input.id)) },
  }));
}

function salariesCreateGuardMock(): MockLink.MockedResponse {
  return failingExpenseMutationMock(
    createExpenseMutationDocument,
    { input: CREATE_INPUT },
    "createExpense",
    "Salaries are created via the carryover settlement flow",
    "EXPENSE_SALARIES_VIA_CARRYOVER_ONLY"
  );
}

function typeImmutableMock(): MockLink.MockedResponse {
  return failingExpenseMutationMock(
    updateExpenseMutationDocument,
    { input: UPDATE_INPUT },
    "updateExpense",
    "Type is immutable",
    "EXPENSE_TYPE_IMMUTABLE_FOR_SALARIES"
  );
}

function genericUpdateFailureMock(): MockLink.MockedResponse {
  return failingExpenseMutationMock(
    updateExpenseMutationDocument,
    { input: UPDATE_INPUT },
    "updateExpense",
    "Ledger write rejected"
  );
}

const onClose = mock(() => {});
const onSaved = mock(() => {});

function renderDialog(options: { readonly mocks?: MockLink.MockedResponse[]; readonly row?: ExpenseFormRow } = {}) {
  return renderWithWrapper(<ExpenseFormDialog open row={options.row ?? null} onClose={onClose} onSaved={onSaved} />, {
    locale,
    mocks: options.mocks ?? [teachersMock()],
  });
}

function submitButton() {
  return screen.getByRole("button", { name: labels.modal.form.submit });
}

/** Picks the seeded teacher through the real autocomplete so the form carries the option. */
async function pickTeacher(dialog: HTMLElement) {
  fireEvent.mouseDown(within(dialog).getByRole("combobox", { name: labels.modal.form.teacher }));
  fireEvent.click(await screen.findByRole("option", { name: new RegExp(TEACHER.name) }));
}

/** Picks EGP through the searchable currency autocomplete (its filter matches the ISO code). */
async function pickCurrency(dialog: HTMLElement) {
  const currencyField = within(dialog).getByRole("combobox", { name: labels.modal.form.currency });
  fireEvent.mouseDown(currencyField);
  fireEvent.change(currencyField, { target: { value: "EGP" } });
  fireEvent.click(await screen.findByRole("option", { name: /EGP/ }));
}

/** Opens the type Select and picks the Marketing option (Salaries stays disabled). */
async function pickMarketingType(dialog: HTMLElement) {
  fireEvent.mouseDown(within(dialog).getByRole("combobox", { name: labels.modal.form.type }));
  fireEvent.click(await screen.findByRole("option", { name: labels.type.Marketing }));
}

function fillDate(dialog: HTMLElement, label: string, value: string) {
  fireEvent.change(within(dialog).getByRole("textbox", { name: label }), { target: { value } });
}

function fillAddForm(dialog: HTMLElement) {
  fillDate(dialog, labels.modal.form.paymentDate, "09/01/2026");
  fillDate(dialog, labels.modal.form.expenseDate, "2026-09");
  fireEvent.change(within(dialog).getByRole("spinbutton", { name: labels.modal.form.value }), {
    target: { value: "1250" },
  });
  fireEvent.change(within(dialog).getByRole("textbox", { name: labels.modal.form.note }), {
    target: { value: "September rent" },
  });
}

/** Drives every required add-mode field so the create submit becomes valid. */
async function fillValidAddForm(dialog: HTMLElement) {
  await pickMarketingType(dialog);
  await pickTeacher(dialog);
  await pickCurrency(dialog);
  fireEvent.change(within(dialog).getByRole("textbox", { name: labels.modal.form.title }), {
    target: { value: "Office rent" },
  });
  fillAddForm(dialog);
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
  onSaved.mockClear();
  showNotification.mockClear();
  mutationCalls = 0;
  useUserAutocompleteStore.setState({ byAudience: { teacher: {}, student: {}, parent: {}, user: {}, staff: {} } });
});

describe("ExpenseFormDialog (component)", () => {
  test("add mode shows the manual-source banner and a disabled Salaries option", async () => {
    renderDialog();

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(labels.modal.form.titleAdd)).toBeInTheDocument();
    expect(within(dialog).getByText(labels.modal.form.sourceBanner(labels.source.Manual))).toBeInTheDocument();
    expect(within(dialog).getByText(labels.modal.form.salariesHint)).toBeInTheDocument();
    // The submit stays locked until a type is chosen (canSubmit guard).
    expect(submitButton()).toBeDisabled();

    fireEvent.mouseDown(within(dialog).getByRole("combobox", { name: labels.modal.form.type }));
    expect(await screen.findByRole("option", { name: labels.type.Salaries })).toHaveAttribute("aria-disabled", "true");
  });

  test("blocks an add submit with missing required fields and fires no mutation", async () => {
    renderDialog({ mocks: [teachersMock()] });

    const dialog = await screen.findByRole("dialog");
    await pickMarketingType(dialog);

    fireEvent.click(submitButton());

    expect(await screen.findByText(labels.validation.titleRequired)).toBeInTheDocument();
    expect(screen.getByText(labels.validation.currencyRequired)).toBeInTheDocument();
    expect(screen.getByText(labels.validation.valueRequired)).toBeInTheDocument();
    expect(screen.getByText(labels.validation.paymentDateInvalid)).toBeInTheDocument();
    expect(screen.getByText(labels.validation.expenseDateInvalid)).toBeInTheDocument();
    expect(mutationCalls).toBe(0);
    expect(onClose).not.toHaveBeenCalled();
    expect(showNotification).not.toHaveBeenCalled();
  });

  test("rejects a negative value without firing the mutation", async () => {
    renderDialog({ mocks: [teachersMock()] });

    const dialog = await screen.findByRole("dialog");
    await pickMarketingType(dialog);
    fireEvent.change(within(dialog).getByRole("spinbutton", { name: labels.modal.form.value }), {
      target: { value: "-5" },
    });
    fireEvent.click(submitButton());

    expect(await screen.findByText(labels.validation.valueNegative)).toBeInTheDocument();
    expect(mutationCalls).toBe(0);
    expect(onClose).not.toHaveBeenCalled();
  });

  test("creates an expense with the exact mutation input and success toast", async () => {
    renderDialog({ mocks: [teachersMock(), teachersMock(TEACHER.name), successfulCreateMock()] });

    const dialog = await screen.findByRole("dialog");
    await fillValidAddForm(dialog);
    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(mutationCalls).toBe(1);
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onSaved).toHaveBeenCalledTimes(1);
    });
    expect(showNotification).toHaveBeenCalledWith(labels.success.created, { severity: "success" });
  });

  test("a double-clicked submit fires exactly one mutation", async () => {
    renderDialog({ mocks: [teachersMock(), teachersMock(TEACHER.name), successfulCreateMock()] });

    const dialog = await screen.findByRole("dialog");
    await fillValidAddForm(dialog);
    const submit = submitButton();
    fireEvent.click(submit);
    fireEvent.click(submit);

    await waitFor(() => {
      expect(mutationCalls).toBe(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  test("edit mode prefills the row and submits the update patch", async () => {
    renderDialog({ row: EDIT_ROW, mocks: [teachersMock(), successfulUpdateMock()] });

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(labels.modal.form.titleEdit)).toBeInTheDocument();
    // The row snapshot prefills the title field.
    expect(within(dialog).getByDisplayValue(EDIT_ROW.title ?? "")).toBeInTheDocument();

    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(mutationCalls).toBe(1);
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onSaved).toHaveBeenCalledTimes(1);
    });
    expect(showNotification).toHaveBeenCalledWith(labels.success.updated, { severity: "success" });
  });

  test("a Salaries row locks type and value and omits them from the patch", async () => {
    renderDialog({ row: SALARIES_ROW, mocks: [teachersMock(), successfulUpdateMock(SALARIES_UPDATE_INPUT)] });

    const dialog = await screen.findByRole("dialog");
    // The locked fields surface their immutable hints and stay disabled.
    expect(within(dialog).getByRole("combobox", { name: labels.modal.form.type })).toHaveAttribute(
      "aria-disabled",
      "true"
    );
    expect(within(dialog).getByRole("spinbutton", { name: labels.modal.form.value })).toBeDisabled();
    expect(within(dialog).getByText(labels.error.typeImmutableForSalaries)).toBeInTheDocument();
    expect(within(dialog).getByText(labels.error.valueImmutableForSalaries)).toBeInTheDocument();

    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(mutationCalls).toBe(1);
      expect(onSaved).toHaveBeenCalledTimes(1);
    });
  });

  test("EXPENSE_TYPE_IMMUTABLE_FOR_SALARIES surfaces inline on the type field", async () => {
    renderDialog({ row: EDIT_ROW, mocks: [teachersMock(), typeImmutableMock()] });

    await screen.findByRole("dialog");
    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(mutationCalls).toBe(1);
    });
    expect(await screen.findByText(labels.error.typeImmutableForSalaries)).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
    expect(showNotification).not.toHaveBeenCalled();
  });

  test("EXPENSE_SALARIES_VIA_CARRYOVER_ONLY shows the server message inline on type", async () => {
    renderDialog({ mocks: [teachersMock(), teachersMock(TEACHER.name), salariesCreateGuardMock()] });

    const dialog = await screen.findByRole("dialog");
    await fillValidAddForm(dialog);
    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(mutationCalls).toBe(1);
    });
    // The create guard carries a server-localized message that wins over the
    // fallback copy on the type field.
    expect(await screen.findByText("Salaries are created via the carryover settlement flow")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(showNotification).not.toHaveBeenCalled();
  });

  test("an unmapped server rejection toasts its message and keeps the dialog open", async () => {
    renderDialog({ row: EDIT_ROW, mocks: [teachersMock(), genericUpdateFailureMock()] });

    await screen.findByRole("dialog");
    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(mutationCalls).toBe(1);
    });
    expect(showNotification).toHaveBeenCalledWith("Ledger write rejected", { severity: "error" });
    expect(onClose).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  test("Escape requests the dialog close", async () => {
    renderDialog();

    const dialog = await screen.findByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Escape" });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  test("Cancel requests the dialog close without a mutation", async () => {
    renderDialog();

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: labels.modal.form.cancel }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    expect(mutationCalls).toBe(0);
  });

  test("passes axe accessibility checks in add mode", async () => {
    const { container } = renderDialog();

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  test("passes axe accessibility checks in edit mode", async () => {
    const { container } = renderDialog({ row: EDIT_ROW, mocks: [teachersMock()] });

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});

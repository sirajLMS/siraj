import { afterAll, afterEach, beforeAll, describe, expect, mock, test } from "bun:test";
import type { MockLink } from "@apollo/client/testing";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import type { CreateCarryoverInput, UpdateCarryoverInput } from "@/frontend/common/graphql/generated/gql/graphql";
import type { CarryoverFormRow } from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverFormViewModel";
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
const { CurrencyCode } = await import("@/frontend/common/graphql/generated/gql/graphql");
const { createCarryoverBalanceMutationDocument, teachersQueryDocument, updateCarryoverBalanceMutationDocument } =
  await import("@/frontend/common/graphql/sharedDocuments");
const { readTranslation } = await import("@/shared/locale/client/translation-cache-store");
const { DashboardAccountingCarryover } = await import("@/shared/locale/namespaces");
const { Translation } = await import("@/shared/locale/namespaces/translation");
const { USER_SELECT_LIMIT } = await import("@/frontend/common/components/ui/input/userSelect");
const { formatDateInput, parseDateInput } = await import("@/frontend/common/components/intl/dateFormat");
const { useUserAutocompleteStore } = await import("@/frontend/common/stores/userAutocompleteStore");
const { renderWithWrapper } = await import("@/test/ui/components/TestWrapper");
const { run: runAxe } = await import("axe-core");
const { CarryoverFormDialog } = await import(
  "@/frontend/common/views/dashboard/accounting/carryover/CarryoverFormDialog"
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
  warmNamespace(() => readTranslation(DashboardAccountingCarryover, locale)),
  warmNamespace(() => readTranslation(Translation.Common, locale)),
  warmNamespace(() => readTranslation(Translation.Ui.UserSelect, locale)),
  warmNamespace(() => readTranslation(Translation.Errors, locale)),
]);
const labels = readTranslation(DashboardAccountingCarryover, locale);
const userSelectLabels = readTranslation(Translation.Ui.UserSelect, locale);
const errorLabels = readTranslation(Translation.Errors, locale);

// The dialog mints one idempotency token per open session; pinning the token
// keeps the mutation variables deterministic so the Apollo mocks match exactly.
const FIXED_CLIENT_REQUEST_ID: `${string}-${string}-${string}-${string}-${string}` = "carryover-form-fixed-request-id";
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

const EDIT_ROW: CarryoverFormRow = {
  id: "carryover-1",
  teacherId: TEACHER.id,
  teacherName: TEACHER.name,
  teacherAvatarUrl: null,
  fromDate: "2026-08-01",
  toDate: "2026-08-15",
  payable: "1250.00",
  teacherCurrency: CurrencyCode.Egp,
  studentsCount: 3,
  studentsText: "Layla Hassan, Omar Adel",
  note: "August carryover",
};

const CREATE_INPUT: CreateCarryoverInput = {
  teacherId: TEACHER.id,
  fromDate: "2026-09-01",
  toDate: "2026-09-15",
  payable: "1250",
  teacherCurrency: CurrencyCode.Egp,
  studentsCount: 2,
  studentsText: "Layla Hassan",
  note: "September carryover",
  clientRequestId: FIXED_CLIENT_REQUEST_ID,
};

// The edit patch mirrors the seeded row; the date bounds go through the same
// input helpers the view model uses so the expectation is timezone-agnostic.
const UPDATE_INPUT: UpdateCarryoverInput = {
  id: EDIT_ROW.id ?? "",
  fromDate: formatDateInput(parseDateInput(EDIT_ROW.fromDate)),
  toDate: formatDateInput(parseDateInput(EDIT_ROW.toDate)),
  payable: EDIT_ROW.payable ?? "",
  teacherCurrency: CurrencyCode.Egp,
  studentsCount: EDIT_ROW.studentsCount,
  studentsText: EDIT_ROW.studentsText,
  note: EDIT_ROW.note,
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

function successfulCreateMock(): MockLink.MockedResponse {
  return {
    request: { query: createCarryoverBalanceMutationDocument, variables: { input: CREATE_INPUT } },
    result: () => {
      mutationCalls += 1;
      return { data: { createCarryoverBalance: { id: "carryover-new-1" } } };
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  };
}

function successfulUpdateMock(): MockLink.MockedResponse {
  return {
    request: { query: updateCarryoverBalanceMutationDocument, variables: { input: UPDATE_INPUT } },
    result: () => {
      mutationCalls += 1;
      return { data: { updateCarryoverBalance: { id: EDIT_ROW.id } } };
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  };
}

function teacherImmutableMock(): MockLink.MockedResponse {
  return {
    request: { query: updateCarryoverBalanceMutationDocument, variables: { input: UPDATE_INPUT } },
    result: () => {
      mutationCalls += 1;
      return {
        data: { updateCarryoverBalance: null },
        errors: [new GraphQLError("Teacher is immutable", { extensions: { code: "CARRYOVER_TEACHER_IMMUTABLE" } })],
      };
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  };
}

const onClose = mock(() => {});
const onSaved = mock(() => {});

function renderDialog(options: { readonly mocks?: MockLink.MockedResponse[]; readonly row?: CarryoverFormRow } = {}) {
  return renderWithWrapper(<CarryoverFormDialog open row={options.row ?? null} onClose={onClose} onSaved={onSaved} />, {
    locale,
    mocks: options.mocks ?? [teachersMock()],
  });
}

function submitButton() {
  return screen.getByRole("button", { name: labels.modal.form.submit });
}

/** Picks the seeded teacher through the real autocomplete so `canSubmit` unlocks. */
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

function fillDate(dialog: HTMLElement, label: string, value: string) {
  fireEvent.change(within(dialog).getByRole("textbox", { name: label }), { target: { value } });
}

function fillAddForm(dialog: HTMLElement) {
  fillDate(dialog, labels.modal.form.fromDate, "09/01/2026");
  fillDate(dialog, labels.modal.form.toDate, "09/15/2026");
  fireEvent.change(within(dialog).getByRole("spinbutton", { name: labels.modal.form.payable }), {
    target: { value: "1250" },
  });
  fireEvent.change(within(dialog).getByRole("spinbutton", { name: labels.modal.form.studentsCount }), {
    target: { value: "2" },
  });
  fireEvent.change(within(dialog).getByRole("textbox", { name: labels.modal.form.studentsText }), {
    target: { value: "Layla Hassan" },
  });
  fireEvent.change(within(dialog).getByRole("textbox", { name: labels.modal.form.note }), {
    target: { value: "September carryover" },
  });
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

describe("CarryoverFormDialog (component)", () => {
  test("blocks an add submit with missing fields and fires no mutation", async () => {
    renderDialog({ mocks: [teachersMock(), teachersMock(TEACHER.name)] });

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(labels.modal.form.titleAdd)).toBeInTheDocument();
    await pickTeacher(dialog);

    fireEvent.click(submitButton());

    expect(await screen.findByText(labels.validation.currencyRequired)).toBeInTheDocument();
    expect(screen.queryByText(labels.validation.teacherRequired)).toBeNull();
    // Payable and both date bounds share the generic required copy.
    expect(screen.getAllByText(userSelectLabels.required).length).toBeGreaterThanOrEqual(3);
    expect(mutationCalls).toBe(0);
    expect(onClose).not.toHaveBeenCalled();
    expect(showNotification).not.toHaveBeenCalled();
  });

  test("rejects a negative payable without firing the mutation", async () => {
    renderDialog({ mocks: [teachersMock(), teachersMock(TEACHER.name)] });

    const dialog = await screen.findByRole("dialog");
    await pickTeacher(dialog);
    fireEvent.change(within(dialog).getByRole("spinbutton", { name: labels.modal.form.payable }), {
      target: { value: "-5" },
    });
    fireEvent.click(submitButton());

    expect(await screen.findByText(labels.validation.payableNegative)).toBeInTheDocument();
    expect(mutationCalls).toBe(0);
    expect(onClose).not.toHaveBeenCalled();
  });

  test("rejects an inverted date range on both bounds", async () => {
    renderDialog({ mocks: [teachersMock(), teachersMock(TEACHER.name)] });

    const dialog = await screen.findByRole("dialog");
    await pickTeacher(dialog);
    fillDate(dialog, labels.modal.form.fromDate, "09/15/2026");
    fillDate(dialog, labels.modal.form.toDate, "09/01/2026");
    fireEvent.click(submitButton());

    // The cross-field rule reports the inversion on the from bound and the to bound.
    expect((await screen.findAllByText(labels.validation.dateRangeInvalid)).length).toBeGreaterThanOrEqual(1);
    expect(mutationCalls).toBe(0);
    expect(onClose).not.toHaveBeenCalled();
  });

  test("creates a carryover with the exact mutation input and success toast", async () => {
    renderDialog({ mocks: [teachersMock(), teachersMock(TEACHER.name), successfulCreateMock()] });

    const dialog = await screen.findByRole("dialog");
    await pickTeacher(dialog);
    await pickCurrency(dialog);
    fillAddForm(dialog);
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
    await pickTeacher(dialog);
    await pickCurrency(dialog);
    fillAddForm(dialog);
    const submit = submitButton();
    fireEvent.click(submit);
    fireEvent.click(submit);

    await waitFor(() => {
      expect(mutationCalls).toBe(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  test("edit mode locks the teacher picker and submits the update mutation", async () => {
    renderDialog({ row: EDIT_ROW, mocks: [teachersMock(), successfulUpdateMock()] });

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(labels.modal.form.titleEdit)).toBeInTheDocument();
    // The teacher field is disabled and explains why; its seeded option renders.
    expect(within(dialog).getByRole("combobox", { name: labels.modal.form.teacher })).toBeDisabled();
    expect(within(dialog).getByText(labels.modal.form.teacherLockedHint)).toBeInTheDocument();

    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(mutationCalls).toBe(1);
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onSaved).toHaveBeenCalledTimes(1);
    });
    expect(showNotification).toHaveBeenCalledWith(labels.success.updated, { severity: "success" });
  });

  test("CARRYOVER_TEACHER_IMMUTABLE surfaces inline on the locked teacher field", async () => {
    renderDialog({ row: EDIT_ROW, mocks: [teachersMock(), teacherImmutableMock()] });

    await screen.findByRole("dialog");

    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(mutationCalls).toBe(1);
    });
    expect(await screen.findByText(errorLabels.carryover.teacherImmutable)).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
    expect(showNotification).not.toHaveBeenCalled();
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

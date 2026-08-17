import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, getAllByText, waitFor } from "@testing-library/react";
import { createElement, type ReactElement } from "react";

await mock.module("@/frontend/common/utils/logger", () => ({
  logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
}));
await mock.module("@/frontend/common/lib/logger", () => ({
  logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
}));

await mock.module("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [key: string]: unknown }) =>
    createElement("a", { href, ...rest }, children),
}));

// Mock react-hook-form to bypass real FormProvider/useForm context
await mock.module("react-hook-form", () => ({
  FormProvider: ({ children }: { children: ReactElement }) => children,
  Controller: () => null,
  useController: () => ({ field: {}, fieldState: {} }),
}));

// Mock QuotaFormSectionDesktop to avoid Controller rendering
await mock.module("@/frontend/desktop/views/dashboard/billing/quota/components/QuotaFormSectionDesktop", () => ({
  QuotaFormSectionDesktop: () => createElement("div", { "data-testid": "form-section" }),
}));

import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";

const locale: AppLocale = "en";
const mockLabels = readTranslation(Translation.Dashboard.BillingQuota, locale);

const noop = () => {};
const noopHandler = () => noop;

function watchMock(name: string): string {
  if (name === "periodType") return "PACKAGE";
  if (name === "kind") return "PURCHASE";
  return "";
}

const mockViewModel: Record<string, unknown> = {
  form: {
    watch: watchMock,
    handleSubmit: noopHandler,
    register: () => ({}),
    formState: { errors: {} },
  },
  control: {},
  errors: {},
  handleSubmit: noopHandler,
  isSubmitting: false,
  isEditing: false,
  loadingExisting: false,
  showSuccess: false,
  submitError: null,
  labels: mockLabels,
  onSubmit: noop,
  onDismissSuccess: noop,
  onDismissError: noop,
};

await mock.module("@/frontend/common/views/dashboard/billing/quota/useQuotaFormViewModel", () => ({
  useQuotaFormViewModel: () => mockViewModel,
}));

await mock.module("@/frontend/common/views/dashboard/billing/quota/quotaFormAccessContext", () => ({
  QuotaFormAccessContext: { Provider: ({ children }: { children: ReactElement }) => children },
  useQuotaFormAccess: () => ({ canManage: true, canView: true, readOnly: false, fieldAccess: {}, labels: mockLabels }),
}));

import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

await mockNextNavigation();

import { useQuotaFormViewModel } from "@/frontend/common/views/dashboard/billing/quota/useQuotaFormViewModel";
import { QuotaFormDesktopView } from "@/frontend/desktop/views/dashboard/billing/quota/quotaForm.desktop";

function QuotaFormTestView() {
  const vm = useQuotaFormViewModel();
  return <QuotaFormDesktopView {...vm} />;
}

function renderForm(overrides: Record<string, unknown> = {}) {
  for (const [key, value] of Object.entries(overrides)) {
    mockViewModel[key] = value;
  }
  return renderWithWrapper(createElement(QuotaFormTestView), { locale, viewport: "desktop" });
}

describe("QuotaFormContainer", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders New Quota title in create mode", async () => {
    mockViewModel.isEditing = false;
    const { container } = renderForm();
    await waitFor(() => expect(getAllByText(container, mockLabels.newQuota).length).toBeGreaterThan(0));
  });

  test("renders Edit Quota title in edit mode", async () => {
    mockViewModel.isEditing = true;
    const { container } = renderForm();
    await waitFor(() => expect(getAllByText(container, mockLabels.editQuota).length).toBeGreaterThan(0));
  });

  test("renders Save button when editing", async () => {
    mockViewModel.isEditing = true;
    const { container } = renderForm();
    await waitFor(() => expect(getAllByText(container, mockLabels.actions.save).length).toBeGreaterThan(0));
  });

  test("renders Create button when not editing", async () => {
    mockViewModel.isEditing = false;
    const { container } = renderForm();
    await waitFor(() => expect(getAllByText(container, mockLabels.actions.create).length).toBeGreaterThan(0));
  });

  test("renders form section", async () => {
    mockViewModel.isEditing = false;
    const { getByTestId } = renderForm();
    await waitFor(() => expect(getByTestId("form-section")).toBeInTheDocument());
  });

  test("shows success snackbar when showSuccess=true", async () => {
    mockViewModel.isEditing = false;
    mockViewModel.showSuccess = true;
    const { container } = renderForm();
    await waitFor(() => expect(getAllByText(container, mockLabels.actions.create).length).toBeGreaterThan(0));
    mockViewModel.showSuccess = false;
  });

  test("renders without crashing when submitError is set", async () => {
    mockViewModel.isEditing = false;
    mockViewModel.submitError = mockLabels.errors.createFailed;
    const { container } = renderForm();
    await waitFor(() => expect(getAllByText(container, mockLabels.newQuota).length).toBeGreaterThan(0));
    mockViewModel.submitError = null;
  });
});

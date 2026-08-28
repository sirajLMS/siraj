import { afterEach, describe, expect, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

await mockNextNavigation("/dashboard", { locale: "en", routingIncludeReplaceAndPrefetch: false });

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, within } from "@testing-library/react";

expect.extend(matchers);

import { TeacherRulesDesktopView } from "@/frontend/desktop/views/dashboard/teachers/rules/teacherRulesView.desktop";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";
import { buildTeacherRulesViewModel } from "@/test/ui/components/teachers/rules/teacherRulesViewFixtures";

const locale: AppLocale = "en";

afterEach(() => {
  cleanup();
});

describe("TeacherRulesDesktopView", () => {
  test("renders the desktop loading state while the handbook URL is loading", () => {
    const viewModel = buildTeacherRulesViewModel(locale, { handbookLoading: true });
    const { container } = renderWithWrapper(<TeacherRulesDesktopView {...viewModel} />, {
      locale,
      viewport: "desktop",
    });
    const view = within(container);

    expect(view.getByRole("progressbar")).toBeInTheDocument();
    expect(view.getByText(viewModel.labelsBySection.policy.title)).toBeInTheDocument();
  });

  test("renders the activation policy panel without a spinner once loaded", () => {
    const viewModel = buildTeacherRulesViewModel(locale);
    const { container } = renderWithWrapper(<TeacherRulesDesktopView {...viewModel} />, {
      locale,
      viewport: "desktop",
    });
    const view = within(container);

    expect(view.queryByRole("progressbar")).toBeNull();
    expect(view.getByText(viewModel.labelsBySection.policy.title)).toBeInTheDocument();
    expect(view.getByText(viewModel.labelsBySection.actions.downloadHandbook)).toBeInTheDocument();
  });
});

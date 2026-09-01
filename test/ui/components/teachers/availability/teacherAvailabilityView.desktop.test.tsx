import { afterEach, describe, expect, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

await mockNextNavigation("/dashboard", { locale: "en", routingIncludeReplaceAndPrefetch: false });

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, within } from "@testing-library/react";

expect.extend(matchers);

import { TeacherAvailabilityDesktopView } from "@/frontend/desktop/views/dashboard/teachers/availability/teacherAvailabilityView.desktop";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";
import {
  AVAILABILITY_TEST_TEACHER,
  TeacherAvailabilityViewHarness,
} from "@/test/ui/components/teachers/availability/teacherAvailabilityViewFixtures";

const locale: AppLocale = "en";
const t = readTranslation(Translation.Dashboard.TeacherAvailability, locale);

afterEach(() => {
  cleanup();
});

describe("TeacherAvailabilityDesktopView", () => {
  test("renders the desktop loading state instead of the weekly grid while loading", () => {
    const { container } = renderWithWrapper(
      <TeacherAvailabilityViewHarness
        locale={locale}
        overrides={{ loading: true }}
        ViewPanel={TeacherAvailabilityDesktopView}
      />,
      { locale, viewport: "desktop" }
    );
    const view = within(container);

    expect(view.getByRole("progressbar")).toBeInTheDocument();
    expect(view.getAllByText(t.searchTitle).length).toBeGreaterThan(0);
    expect(view.queryByText(AVAILABILITY_TEST_TEACHER)).toBeNull();
  });

  test("renders the weekly availability grid without a spinner once loaded", () => {
    const { container } = renderWithWrapper(
      <TeacherAvailabilityViewHarness locale={locale} ViewPanel={TeacherAvailabilityDesktopView} />,
      { locale, viewport: "desktop" }
    );
    const view = within(container);

    expect(view.queryByRole("progressbar")).toBeNull();
    expect(view.getByText(t.table.monday)).toBeInTheDocument();
    expect(view.getByText(AVAILABILITY_TEST_TEACHER)).toBeInTheDocument();
  });
});

import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { StudentHistoryMobileView } from "@/frontend/mobile/views/dashboard/students/history/studentHistory.mobile";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import {
  createStudentHistoryViewProps,
  HISTORY_ENROLLMENT_MONTH,
  HISTORY_MONTH_UNDER_TEST,
  HISTORY_NOW_MONTH,
} from "@/test/ui/components/fixtures/studentHistoryFixtures";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "en";
const labels = readTranslation(Translation.Dashboard.StudentHistory, locale);

const permissions = [AppPermission.StudentHistoryViewOther];

afterEach(() => {
  cleanup();
});

describe("StudentHistoryMobileView month bounds", () => {
  test("enables both steppers when no enrollment/now bounds are set", () => {
    renderWithWrapper(
      <StudentHistoryMobileView
        {...createStudentHistoryViewProps({ labels, currentMonth: HISTORY_MONTH_UNDER_TEST })}
      />,
      { locale, permissions, viewport: "mobile" }
    );

    expect(screen.getByRole("button", { name: labels.previousMonth })).toBeEnabled();
    expect(screen.getByRole("button", { name: labels.nextMonth })).toBeEnabled();
  });

  test("enables both steppers between the enrollment and now bounds", () => {
    renderWithWrapper(
      <StudentHistoryMobileView
        {...createStudentHistoryViewProps({
          labels,
          currentMonth: HISTORY_MONTH_UNDER_TEST,
          enrollmentMonth: HISTORY_ENROLLMENT_MONTH,
          nowMonth: HISTORY_NOW_MONTH,
        })}
      />,
      { locale, permissions, viewport: "mobile" }
    );

    expect(screen.getByRole("button", { name: labels.previousMonth })).toBeEnabled();
    expect(screen.getByRole("button", { name: labels.nextMonth })).toBeEnabled();
  });

  test("disables prev at the enrollment month and keeps next enabled", () => {
    renderWithWrapper(
      <StudentHistoryMobileView
        {...createStudentHistoryViewProps({
          labels,
          currentMonth: HISTORY_ENROLLMENT_MONTH,
          nowMonth: HISTORY_NOW_MONTH,
        })}
      />,
      { locale, permissions, viewport: "mobile" }
    );

    expect(screen.getByRole("button", { name: labels.previousMonth })).toBeDisabled();
    expect(screen.getByRole("button", { name: labels.nextMonth })).toBeEnabled();
  });

  test("disables next at the now month and keeps prev enabled", () => {
    renderWithWrapper(
      <StudentHistoryMobileView
        {...createStudentHistoryViewProps({
          labels,
          currentMonth: HISTORY_NOW_MONTH,
          enrollmentMonth: HISTORY_ENROLLMENT_MONTH,
        })}
      />,
      { locale, permissions, viewport: "mobile" }
    );

    expect(screen.getByRole("button", { name: labels.previousMonth })).toBeEnabled();
    expect(screen.getByRole("button", { name: labels.nextMonth })).toBeDisabled();
  });
});

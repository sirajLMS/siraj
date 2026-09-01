import { afterEach, describe, expect, mock, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

// Mutable route params so tests can toggle between "missing id" and
// "id present" containers without re-registering module mocks.
const routeParams: { id?: string } = {};

await mockNextNavigation("/teachers/reassignment", { locale: "ar" });
await mock.module("next/navigation", () => ({
  useParams: () => ({ locale: "ar", id: routeParams.id }),
  useRouter: () => ({ back: () => {} }),
  usePathname: () => "/teachers/reassignment",
  useSearchParams: () => new URLSearchParams(),
}));

// The container renders the invalid-id / load-failure branches before any
// notification side-effect; a no-op notifications context keeps the test
// free of the Toolpad provider.
await mock.module("@toolpad/core/useNotifications", () => ({
  useNotifications: () => ({ show: () => {}, close: () => {} }),
}));

import type { MockLink } from "@apollo/client/testing";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import { studentByIdQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { TeacherReassignmentContainer } from "@/frontend/common/views/dashboard/teachers/reassignment/TeacherReassignmentContainer";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";

// The reassignment namespace is not part of the shared translation preload -
// warm the cache here so readTranslation resolves synchronously.
const pendingTranslations: Promise<unknown>[] = [];
try {
  readTranslation(Translation.Dashboard.TeacherReassignment, locale);
} catch (thrown) {
  if (thrown instanceof Promise) {
    pendingTranslations.push(thrown);
  }
}
await Promise.all(pendingTranslations);

const labels = readTranslation(Translation.Dashboard.TeacherReassignment, locale);
const commonLabels = readTranslation(Translation.Common, locale);

function createErrorMocks(): MockLink.MockedResponse[] {
  return [
    {
      request: {
        query: studentByIdQueryDocument,
        variables: { studentId: routeParams.id },
      },
      error: new Error("network failure"),
    },
  ];
}

afterEach(() => {
  routeParams.id = undefined;
  cleanup();
});

describe("TeacherReassignmentContainer error states", () => {
  test("missing route id renders the shared ErrorState alert", () => {
    renderWithWrapper(<TeacherReassignmentContainer />, { locale });

    const alert = screen.getByText(labels.errors.invalidId).closest(".MuiAlert-root");
    expect(alert).not.toBeNull();
  });

  test("query failure renders the shared ErrorState alert with the common load-failure message", async () => {
    routeParams.id = "student-1";
    renderWithWrapper(<TeacherReassignmentContainer />, { locale, mocks: createErrorMocks() });

    const alertMessage = await screen.findByText(commonLabels.loadFailed);
    expect(alertMessage.closest(".MuiAlert-root")).not.toBeNull();
  });
});

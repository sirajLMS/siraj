import { afterEach, describe, expect, mock, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

await mockNextNavigation("/teachers", { locale: "ar" });

await mock.module("next/link", () => ({
  default: ({
    children,
    href,
    prefetch: _prefetch,
    replace: _replace,
    scroll: _scroll,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    prefetch?: boolean;
    replace?: boolean;
    scroll?: boolean;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// ViewAsUserButton is an upstream permission-gated auth widget; it stays
// untouched here and renders nothing for non-super-admin actors in tests.
await mock.module("@/frontend/common/components/auth/ViewAsUserButton", () => ({
  ViewAsUserButton: () => null,
}));

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen } from "@testing-library/react";

expect.extend(matchers);

import {
  AccountStatus,
  type TeacherDirectoryQuery_teacherDirectory_rows as TeacherDirectoryRow,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { TeachersMobileView } from "@/frontend/mobile/views/dashboard/teachers/home/teachersView.mobile";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";

// The teachers directory namespace is not part of the shared translation
// preload yet - warm the cache here so readTranslation resolves synchronously.
const pendingTranslations: Promise<unknown>[] = [];
try {
  readTranslation(Translation.Dashboard.TeachersDirectory, locale);
} catch (thrown) {
  if (thrown instanceof Promise) {
    pendingTranslations.push(thrown);
  }
}
await Promise.all(pendingTranslations);

const labels = readTranslation(Translation.Dashboard.TeachersDirectory, locale);
const adminLabels = readTranslation(Translation.Dashboard.Admin, locale);

function noop(): void {
  // Intentional no-op for props whose behavior is out of scope for these tests.
}

function makeRow(overrides: Partial<TeacherDirectoryRow> = {}): TeacherDirectoryRow {
  return {
    id: "teacher-1",
    userId: "user-1",
    index: null,
    name: "Layla Hassan",
    email: "[EMAIL_REDACTED]",
    avatarUrl: null,
    status: AccountStatus.Activated,
    ...overrides,
  };
}

function renderView(options: { readonly onPageChange?: (page: number) => void } = {}) {
  return renderWithWrapper(
    <TeachersMobileView
      labels={labels}
      metrics={null}
      rows={[makeRow()]}
      searchQuery=""
      onSearchChange={noop}
      page={0}
      pageSize={10}
      totalCount={25}
      onPageChange={options.onPageChange ?? noop}
      totalTeachers={25}
      canCreateTeacher
    />,
    { locale, viewport: "mobile" }
  );
}

afterEach(() => {
  cleanup();
});

describe("TeachersMobileView server pagination forwarding (regression)", () => {
  test("forwards server paginationOptions through TeacherCardList into MobileCardList", () => {
    renderView();

    // Server mode must derive the pager from totalCount (25), not the single
    // rendered row — a client/false pagination regression shows "1-1 من 1".
    expect(screen.getByText(adminLabels.paginationRange(1, 10, 25))).toBeInTheDocument();
    expect(screen.getByText(adminLabels.pageOf(1, 3))).toBeInTheDocument();
  });

  test("routes pager navigation back to the view's onPageChange", () => {
    const onPageChange = mock((_page: number) => undefined);
    const { container } = renderView({ onPageChange });

    const nextButton = container.querySelector(`[aria-label="${adminLabels.nextPage}"] button`);
    if (!nextButton) {
      throw new Error("next page button not found in card list pager");
    }
    fireEvent.click(nextButton);

    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  test("still renders the card list content alongside the pager", () => {
    const { container } = renderView();

    expect(container.textContent).toContain("Layla Hassan");
  });
});

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
import { cleanup, fireEvent, within } from "@testing-library/react";

expect.extend(matchers);

import { getStatusColors } from "@/frontend/common/components/ui/badge/statusBadgeShared.utils";
import {
  AccountStatus,
  type TeacherDirectoryQuery_teacherDirectory_rows as TeacherDirectoryRow,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { createAppTheme } from "@/frontend/common/providers/theme/theme";
import { TeacherCardList } from "@/frontend/mobile/views/dashboard/teachers/home/components/teacherCardList.mobile";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { getEmotionStylesForElement } from "@/test/ui/components/helpers/emotionStyles";
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
const meetingUrlLabels = readTranslation(Translation.Dashboard.MeetingUrlStatus, locale);
const theme = createAppTheme("dark", "rtl", locale);

function noop(): void {
  // Intentional no-op for props whose behavior is out of scope for these tests.
}

function makeRow(overrides: Partial<TeacherDirectoryRow> = {}): TeacherDirectoryRow {
  return {
    id: "teacher-1",
    userId: "user-1",
    index: null,
    name: "Layla Hassan",
    email: "layla@example.com",
    avatarUrl: null,
    status: AccountStatus.Activated,
    ...overrides,
  };
}

function renderCardList(
  options: {
    readonly rows?: readonly TeacherDirectoryRow[];
    readonly searchQuery?: string;
    readonly onSearchChange?: (query: string) => void;
  } = {}
) {
  return renderWithWrapper(
    <TeacherCardList
      rows={options.rows ?? [makeRow()]}
      searchQuery={options.searchQuery ?? ""}
      onSearchChange={options.onSearchChange ?? noop}
      paginationOptions={false}
      labels={labels}
    />,
    { locale }
  );
}

function expectBadgeColors(labelText: string, badgeStatus: string, container: HTMLElement): void {
  const labelElement = within(container).getByText(labelText);
  const badge = labelElement.parentElement;
  if (!badge) {
    throw new Error("Status badge element not found");
  }
  const expected = getStatusColors(theme, "staffAccount", badgeStatus);
  const css = getEmotionStylesForElement(badge).replace(/\s+/g, "");
  expect(css).toContain(`background-color:${expected.backgroundColor}`);
  expect(css).toContain(`color:${expected.color}`);
}

afterEach(() => {
  cleanup();
});

describe("TeacherCardList (mobile)", () => {
  test("propagates SearchBarField edits to onSearchChange", () => {
    const onSearchChange = mock((_query: string) => undefined);
    const { container } = renderCardList({ onSearchChange });

    const input = container.querySelector("input");
    if (!input) {
      throw new Error("Search input not found");
    }
    expect(input.getAttribute("placeholder")).toBe(labels.fields.searchTeachers);

    fireEvent.change(input, { target: { value: "Layla" } });

    expect(onSearchChange).toHaveBeenCalledTimes(1);
    expect(onSearchChange).toHaveBeenCalledWith("Layla");
  });

  test("renders active teachers with the staff account badge palette", () => {
    const { container } = renderCardList();

    expectBadgeColors(labels.status.active, "activated", container);
  });

  test("renders deactivated teachers with the deactivated staff palette and the URL-status join badge", () => {
    const { container } = renderCardList({ rows: [makeRow({ status: AccountStatus.Deactivated })] });

    expectBadgeColors(labels.status.offline, "deactivated", container);

    // The join affordance is MobileMeetingJoinAction; without a resolvable meeting URL it
    // surfaces the pending URL-status badge instead of an enabled join button.
    expect(within(container).queryByRole("button", { name: labels.actions.joinRoom })).toBeNull();
    expect(within(container).getByText(meetingUrlLabels.urlPending)).toBeInTheDocument();
  });

  test("renders the join affordance with URL-status handling for active teachers", () => {
    const { container } = renderCardList();

    expect(within(container).getByText(meetingUrlLabels.urlPending)).toBeInTheDocument();
  });

  test("renders schedule and options actions as shared action links", () => {
    const { container } = renderCardList();

    const scheduleLink = container.querySelector(`a[aria-label="${labels.actions.viewSchedule}"]`);
    expect(scheduleLink).not.toBeNull();
    expect(scheduleLink?.getAttribute("href")).toBe("/teachers/teacher-1/schedule/weekly");

    const optionsLink = container.querySelector(`a[aria-label="${labels.actions.options}"]`);
    expect(optionsLink).not.toBeNull();
    expect(optionsLink?.getAttribute("href")).toBe("/users/user-1/profile");
  });

  test("omits schedule and options links when the row has no resolvable target", () => {
    const { container } = renderCardList({ rows: [makeRow({ id: null, userId: null })] });

    expect(container.querySelector(`a[aria-label="${labels.actions.viewSchedule}"]`)).toBeNull();
    expect(container.querySelector(`a[aria-label="${labels.actions.options}"]`)).toBeNull();
  });
});

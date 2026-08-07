import { afterEach, describe, expect, mock, test } from "bun:test";

mock.module("next/navigation", () => ({
  useParams: () => ({ locale: "en" }),
  useRouter: () => ({
    push: () => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
    replace: () => {},
    prefetch: () => {},
  }),
  usePathname: () => "/students/history",
  useSearchParams: () => new URLSearchParams(),
  redirect: () => {},
}));

mock.module("@/shared/i18n/routing", () => ({
  locales: ["ar", "en"] as const,
  defaultLocale: "en",
  useRouter: () => ({
    push: () => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
    replace: () => {},
    prefetch: () => {},
  }),
  usePathname: () => "/students/history",
  Link: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  redirect: () => {},
}));

mock.module("@/shared/i18n/navigation", () => ({
  useRouter: () => ({
    push: mock(() => {}),
    back: mock(() => {}),
    forward: mock(() => {}),
    refresh: mock(() => {}),
    replace: mock(() => {}),
    prefetch: mock(() => {}),
  }),
  usePathname: () => "/students/history",
}));

mock.module("@/frontend/common/hooks/useLanguageSwitch", () => ({
  useLanguageSwitch: () => ({ currentLocale: "en", switchLanguage: () => {}, isPending: false }),
}));

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

expect.extend(matchers);

import { GenericTabNavMobileView } from "@/frontend/mobile/views/dashboard/components/genericTabNav.mobile";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

const dateTabs = [
  { id: "1", weekdayLabel: "Wed", dayNumber: 1, hasSession: true },
  { id: "2", weekdayLabel: "Thu", dayNumber: 2, hasSession: false },
  { id: "3", weekdayLabel: "Fri", dayNumber: 3, hasSession: true },
] as const;

afterEach(() => {
  cleanup();
});

describe("GenericTabNav date variant", () => {
  test("renders weekday and day number for each tab", () => {
    render(
      <TestWrapper locale="en" themeMode="dark">
        <GenericTabNavMobileView
          variant="date"
          mode="button"
          activeTab="1"
          tabs={dateTabs}
          onTabChange={() => {}}
          ariaLabel="Month days"
        />
      </TestWrapper>
    );

    expect(screen.getByRole("tablist", { name: "Month days" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Wed/i })).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  test("calls onTabChange when a day tab is clicked", () => {
    const onTabChange = mock((id: string) => id);

    render(
      <TestWrapper locale="en" themeMode="dark">
        <GenericTabNavMobileView variant="date" mode="button" activeTab="1" tabs={dateTabs} onTabChange={onTabChange} />
      </TestWrapper>
    );

    fireEvent.click(screen.getByRole("tab", { name: /Fri/i }));
    expect(onTabChange).toHaveBeenCalledWith("3");
  });
});

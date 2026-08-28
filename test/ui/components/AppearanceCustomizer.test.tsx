import { afterEach, describe, expect, mock, test } from "bun:test";

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { type ReactNode, useState } from "react";

expect.extend(matchers);

// Mock next/navigation BEFORE importing any component that transitively
// imports it. `mockNextNavigation` registers `useRouter` / `usePathname` /
// `useSearchParams` plus the i18n routing shims that `AppearanceSettingsTab`
// and `CustomizeOverlay` both reach for.
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

await mockNextNavigation("/dashboard/settings", { locale: "en" });

// `useCustomizeMode` is the gate for CustomizeOverlay's focus-trap + escape
// handler. We mock it with a mutable value so tests can flip customize mode
// on/off without changing the URL.
let customizeModeValue = false;
const useCustomizeModeMock = mock((): boolean => customizeModeValue);
await mock.module("@/frontend/common/hooks/useCustomizeMode", () => ({
  useCustomizeMode: useCustomizeModeMock,
}));

// `@toolpad/core/useNotifications` requires a Toolpad provider chain that
// TestWrapper doesn't set up. AppearanceSettingsTab only calls `show`, so a
// minimal mock is enough.
const showNotification = mock(() => {});
await mock.module("@toolpad/core/useNotifications", () => ({
  useNotifications: () => ({ show: showNotification }),
}));

import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { useAppearancePreviewStore } from "@/frontend/common/stores/appearancePreviewStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { CustomizeOverlay } from "@/frontend/common/views/dashboard/components/customize/CustomizeOverlay";
import { WcagBadge } from "@/frontend/common/views/dashboard/components/customize/WcagBadge";
import { AppearanceSettingsTab } from "@/frontend/common/views/dashboard/settings/tabs/appearance/AppearanceSettingsTab";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

function withWrapper({ children }: { children: ReactNode }) {
  return (
    <TestWrapper locale="en" themeMode="light">
      {children}
    </TestWrapper>
  );
}

afterEach(() => {
  cleanup();
  useUserStore.setState({ permissions: [] }, false);
  useAppearancePreviewStore.getState().resetToDefaults();
  customizeModeValue = false;
  useCustomizeModeMock.mockClear();
  showNotification.mockClear();
});

// ---------------------------------------------------------------------------
// Tier 1 — WcagBadge: renders the correct grade + numeric ratio for a given
// brand color. The badge is pure: same hex always yields the same output.
// ---------------------------------------------------------------------------
describe("WcagBadge (Tier 1)", () => {
  test("renders AAA grade and 21.00:1 ratio for pure black (#000000)", () => {
    const { container } = render(<WcagBadge hex="#000000" />, { wrapper: withWrapper });
    expect(screen.getByText("AAA")).toBeInTheDocument();
    expect(screen.getByText("21.00:1")).toBeInTheDocument();
    expect(container.querySelector('[aria-label="WCAG AAA"]')).toBeInTheDocument();
  });

  test("renders AAA grade for pure white (#ffffff -> pickOnPrimary picks black -> ratio 21)", () => {
    render(<WcagBadge hex="#ffffff" />, { wrapper: withWrapper });
    expect(screen.getByText("AAA")).toBeInTheDocument();
    expect(screen.getByText("21.00:1")).toBeInTheDocument();
  });

  test("renders AA grade for MUI default primary #1976d2 (ratio ~4.6)", () => {
    render(<WcagBadge hex="#1976d2" />, { wrapper: withWrapper });
    expect(screen.getByText("AA")).toBeInTheDocument();
    // pickOnPrimary(#1976d2) -> #ffffff; ratio ~4.60 -> "4.60:1"
    expect(screen.getByText(/\d{1,2}\.\d{2}:1/)).toBeInTheDocument();
  });

  test("renders an accessible pill with aria-label 'WCAG <grade>'", () => {
    const { container } = render(<WcagBadge hex="#000000" />, { wrapper: withWrapper });
    expect(container.querySelector('[aria-label="WCAG AAA"]')).toBeInTheDocument();
    expect(container.querySelector('[aria-label="WCAG Fail"]')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tier 2 — WcagBadge: the badge re-renders with the new grade when the hex
// prop changes (AC-32 live contrast feedback).
// ---------------------------------------------------------------------------
describe("WcagBadge (Tier 2 - color change updates badge)", () => {
  test("updates grade and ratio when hex prop changes from AAA to AA", () => {
    const { rerender } = render(<WcagBadge hex="#000000" />, { wrapper: withWrapper });
    expect(screen.getByText("AAA")).toBeInTheDocument();
    expect(screen.getByText("21.00:1")).toBeInTheDocument();

    rerender(<WcagBadge hex="#1976d2" />);
    expect(screen.getByText("AA")).toBeInTheDocument();
    expect(screen.queryByText("AAA")).toBeNull();
    expect(screen.getByText(/\d{1,2}\.\d{2}:1/)).toBeInTheDocument();
  });

  test("updates grade when hex prop changes from AA back to AAA", () => {
    const { rerender } = render(<WcagBadge hex="#1976d2" />, { wrapper: withWrapper });
    expect(screen.getByText("AA")).toBeInTheDocument();

    rerender(<WcagBadge hex="#ffffff" />);
    expect(screen.getByText("AAA")).toBeInTheDocument();
    expect(screen.queryByText("AA")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tier 1 — AppearanceSettingsTab: renders hero, status chips, and the
// "Enter Customize Mode" CTA when the user has permission.
// ---------------------------------------------------------------------------
describe("AppearanceSettingsTab (Tier 1)", () => {
  test("renders no-permission fallback when user lacks SettingsAppearanceManage", () => {
    useUserStore.setState({ permissions: [] }, false);
    render(<AppearanceSettingsTab />, {
      wrapper: ({ children }) => (
        <TestWrapper locale="en" themeMode="light" permissions={[]}>
          {children}
        </TestWrapper>
      ),
    });

    expect(screen.getByText("You don't have permission to manage site appearance.")).toBeInTheDocument();
    expect(screen.queryByText("Enter Customize Mode")).toBeNull();
  });

  test("renders hero title, subtitle, status chips, and Enter Customize Mode CTA with permission", async () => {
    render(<AppearanceSettingsTab />, {
      wrapper: ({ children }) => (
        <TestWrapper locale="en" themeMode="light" permissions={[AppPermission.SettingsAppearanceManage]}>
          {children}
        </TestWrapper>
      ),
    });

    // The tab now lazy-loads its tier view via `createLazyView`, so the body
    // renders asynchronously — await it before asserting.
    expect(await screen.findByText("Site Appearance")).toBeInTheDocument();
    expect(screen.getByText(/Customize your site's branding, colors, and visual identity/)).toBeInTheDocument();
    expect(screen.getByText("Published")).toBeInTheDocument();
    expect(screen.getByText("Draft has changes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enter Customize Mode" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Draft" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish Now" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export JSON" })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Tier 1 — CustomizeOverlay: renders children when customize mode is off,
// and mounts the aria-live announce region + error boundary when on.
// ---------------------------------------------------------------------------
describe("CustomizeOverlay (Tier 1)", () => {
  test("renders children when customize mode is off (no aria-live region)", () => {
    customizeModeValue = false;
    const { container } = render(
      <CustomizeOverlay>
        <div data-testid="child">child content</div>
      </CustomizeOverlay>,
      { wrapper: withWrapper }
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(container.querySelector('[aria-live="polite"]')).toBeNull();
  });

  test("renders aria-live announce region when customize mode is on", () => {
    customizeModeValue = true;
    const { container } = render(
      <CustomizeOverlay>
        <div data-testid="child">child content</div>
      </CustomizeOverlay>,
      { wrapper: withWrapper }
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
    expect(liveRegion?.getAttribute("aria-atomic")).toBe("true");
  });
});

// ---------------------------------------------------------------------------
// Tier 2 — CustomizeOverlay: keyboard focus restoration (AC-35). When
// customize mode is on and the user presses Escape, focus returns to the
// element that had focus before the overlay opened.
// ---------------------------------------------------------------------------
describe("CustomizeOverlay (Tier 2 - Escape restores focus)", () => {
  test("Escape key restores focus to previously-focused trigger element", () => {
    customizeModeValue = false;

    function Harness() {
      // Re-render on state change so the mock's new value takes effect.
      const [, setTick] = useState(0);
      return (
        <>
          <button
            type="button"
            data-testid="trigger"
            onClick={() => {
              customizeModeValue = true;
              setTick(t => t + 1);
            }}
          >
            Open Customizer
          </button>
          <CustomizeOverlay>
            <div data-testid="overlay-content">overlay body</div>
          </CustomizeOverlay>
        </>
      );
    }

    render(<Harness />, { wrapper: withWrapper });

    const trigger = screen.getByTestId("trigger");
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    // Enter customize mode — the overlay's effect captures `previousFocusRef`
    // from `document.activeElement` (the trigger).
    fireEvent.click(trigger);

    // Press Escape — the overlay's keydown listener should restore focus.
    fireEvent.keyDown(document, { key: "Escape" });

    expect(document.activeElement).toBe(trigger);
  });
});

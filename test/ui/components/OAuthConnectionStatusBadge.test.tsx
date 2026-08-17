import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, render, screen } from "@testing-library/react";

expect.extend(matchers);

import {
  OAuthConnectionStatusBadge,
  type OAuthConnectionStatusBadgeProps,
} from "@/frontend/common/components/ui/display/meetingConfig/OAuthConnectionStatusBadge";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";
const t = readTranslation(Translation.Dashboard.OAuthFlow, locale);

const fixedNow = new Date("2025-06-15T12:00:00Z").getTime();
let originalDateNow: typeof Date.now;

beforeEach(() => {
  originalDateNow = Date.now;
  Date.now = () => fixedNow;
});

afterEach(() => {
  Date.now = originalDateNow;
  cleanup();
});

function renderBadge(props: OAuthConnectionStatusBadgeProps) {
  return render(<OAuthConnectionStatusBadge {...props} />, {
    wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
  });
}

function daysInMs(days: number) {
  return days * 24 * 60 * 60 * 1000;
}

describe("OAuthConnectionStatusBadge", () => {
  test("renders connected status", () => {
    renderBadge({ status: "connected" });
    expect(screen.getByText(t.statusConnected)).toBeInTheDocument();
  });

  test("renders expiring status with countdown days", () => {
    renderBadge({
      status: "expiring",
      expiresAt: new Date(fixedNow + daysInMs(5)).toISOString(),
    });
    expect(screen.getByText(t.expiresInDays(5))).toBeInTheDocument();
  });

  test("renders expiring status with 1 day countdown", () => {
    renderBadge({
      status: "expiring",
      expiresAt: new Date(fixedNow + daysInMs(1)).toISOString(),
    });
    expect(screen.getByText(t.expiresInDays(1))).toBeInTheDocument();
  });

  test("renders expiring status with 2 days countdown", () => {
    renderBadge({
      status: "expiring",
      expiresAt: new Date(fixedNow + daysInMs(2)).toISOString(),
    });
    expect(screen.getByText(t.expiresInDays(2))).toBeInTheDocument();
  });

  test("renders expired status when expiring but days <= 0", () => {
    renderBadge({
      status: "expiring",
      expiresAt: new Date(fixedNow - 1000).toISOString(),
    });
    expect(screen.getByText(t.statusExpired)).toBeInTheDocument();
  });

  test("renders standalone expired status", () => {
    renderBadge({ status: "expired" });
    expect(screen.getByText(t.statusExpired)).toBeInTheDocument();
  });

  test("renders disconnected status", () => {
    renderBadge({ status: "disconnected" });
    expect(screen.getByText(t.statusNotConnected)).toBeInTheDocument();
  });

  test("expiring with null expiresAt renders statusExpiring label", () => {
    renderBadge({ status: "expiring", expiresAt: null });
    expect(screen.getByText(t.statusExpiring)).toBeInTheDocument();
  });

  test("has status aria-label", () => {
    renderBadge({ status: "connected" });
    expect(screen.getByLabelText(t.statusAriaLabel)).toBeInTheDocument();
  });

  test("renders with custom sx prop", () => {
    renderBadge({ status: "connected" });
    expect(screen.getByText(t.statusConnected)).toBeInTheDocument();
  });
});

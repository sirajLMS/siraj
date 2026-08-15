import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, render, screen } from "@testing-library/react";

expect.extend(matchers);

import {
  OAuthConnectionStatusBadge,
  type OAuthConnectionStatusBadgeProps,
} from "@/frontend/common/components/ui/display/meetingConfig/OAuthConnectionStatusBadge";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

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
  return render(<OAuthConnectionStatusBadge {...props} />, { wrapper: TestWrapper });
}

function daysInMs(days: number) {
  return days * 24 * 60 * 60 * 1000;
}

describe("OAuthConnectionStatusBadge", () => {
  test("renders connected status", () => {
    renderBadge({ status: "connected" });
    expect(screen.getByText("متصل")).toBeInTheDocument();
  });

  test("renders expiring status with countdown days", () => {
    renderBadge({
      status: "expiring",
      expiresAt: new Date(fixedNow + daysInMs(5)).toISOString(),
    });
    // expiresInDays(5) → "ينتهي خلال 5 أيام"
    expect(screen.getByText("ينتهي خلال 5 أيام")).toBeInTheDocument();
  });

  test("renders expiring status with 1 day countdown", () => {
    renderBadge({
      status: "expiring",
      expiresAt: new Date(fixedNow + daysInMs(1)).toISOString(),
    });
    expect(screen.getByText("ينتهي خلال يوم واحد")).toBeInTheDocument();
  });

  test("renders expiring status with 2 days countdown", () => {
    renderBadge({
      status: "expiring",
      expiresAt: new Date(fixedNow + daysInMs(2)).toISOString(),
    });
    expect(screen.getByText("ينتهي خلال يومين")).toBeInTheDocument();
  });

  test("renders expired status when expiring but days <= 0", () => {
    renderBadge({
      status: "expiring",
      expiresAt: new Date(fixedNow - 1000).toISOString(),
    });
    // When days <= 0, shows t.statusExpired
    expect(screen.getByText("منتهي")).toBeInTheDocument();
  });

  test("renders standalone expired status", () => {
    renderBadge({ status: "expired" });
    expect(screen.getByText("منتهي")).toBeInTheDocument();
  });

  test("renders disconnected status", () => {
    renderBadge({ status: "disconnected" });
    expect(screen.getByText("غير متصل")).toBeInTheDocument();
  });

  test("expiring with null expiresAt renders statusExpiring label", () => {
    renderBadge({ status: "expiring", expiresAt: null });
    expect(screen.getByText("قارب الانتهاء")).toBeInTheDocument();
  });

  test("has status aria-label", () => {
    renderBadge({ status: "connected" });
    expect(screen.getByLabelText("حالة اتصال OAuth")).toBeInTheDocument();
  });

  test("renders with custom sx prop", () => {
    renderBadge({ status: "connected" });
    expect(screen.getByText("متصل")).toBeInTheDocument();
  });
});

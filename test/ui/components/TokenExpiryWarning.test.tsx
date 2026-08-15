import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

expect.extend(matchers);

import { TokenExpiryWarning } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/TokenExpiryWarning";
import type { MeetingConfigEnhancementLabels } from "@/shared/locale/types/ui";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

const REAL_NOW = Date.now;
beforeEach(() => {
  // Fixed time for deterministic tests: 2025-01-15T12:00:00Z
  Date.now = () => 1736932800000;
});
afterEach(() => {
  Date.now = REAL_NOW;
});

const labels = {
  expiresInDays: (days: number) => `تنتهي خلال ${days} يوم`,
  expiresInHours: (hours: number) => `تنتهي خلال ${hours} ساعة`,
  expired: "منتهي",
  reconnect: "إعادة الربط",
} as unknown as Pick<MeetingConfigEnhancementLabels, "expiresInDays" | "expiresInHours" | "expired" | "reconnect">;

describe("TokenExpiryWarning", () => {
  test("returns null when expiresAt is null", () => {
    const { container } = render(
      <TokenExpiryWarning labels={labels} providerName="Zoom" expiresAt={null} onReconnect={mock(() => {})} />,
      { wrapper: TestWrapper }
    );
    expect(container.firstChild).toBeNull();
  });

  test("returns null when expiresAt is far in the future (safe)", () => {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const { container } = render(
      <TokenExpiryWarning labels={labels} providerName="Zoom" expiresAt={future} onReconnect={mock(() => {})} />,
      { wrapper: TestWrapper }
    );
    expect(container.firstChild).toBeNull();
  });

  test("warning level shows days countdown", () => {
    const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days
    render(
      <TokenExpiryWarning labels={labels} providerName="Zoom" expiresAt={future} onReconnect={mock(() => {})} />,
      { wrapper: TestWrapper }
    );
    expect(screen.getByText(/Zoom · تنتهي خلال 10 يوم/)).toBeInTheDocument();
    expect(screen.getByText("إعادة الربط")).toBeInTheDocument();
  });

  test("critical level shows hours countdown", () => {
    const future = new Date(Date.now() + 5 * 60 * 60 * 1000); // 5 hours
    render(
      <TokenExpiryWarning labels={labels} providerName="Zoom" expiresAt={future} onReconnect={mock(() => {})} />,
      { wrapper: TestWrapper }
    );
    expect(screen.getByText(/Zoom · تنتهي خلال 5 ساعة/)).toBeInTheDocument();
  });

  test("expired level shows expired label", () => {
    const past = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    render(
      <TokenExpiryWarning labels={labels} providerName="Zoom" expiresAt={past} onReconnect={mock(() => {})} />,
      { wrapper: TestWrapper }
    );
    expect(screen.getByText(/Zoom · منتهي/)).toBeInTheDocument();
  });

  test("calls onReconnect when reconnect button clicked", () => {
    const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const onReconnect = mock(() => {});
    render(
      <TokenExpiryWarning labels={labels} providerName="Zoom" expiresAt={future} onReconnect={onReconnect} />,
      { wrapper: TestWrapper }
    );
    fireEvent.click(screen.getByText("إعادة الربط"));
    expect(onReconnect).toHaveBeenCalledTimes(1);
  });

  test("reconnecting=true disables reconnect button and shows spinner", () => {
    const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    render(
      <TokenExpiryWarning labels={labels} providerName="Zoom" expiresAt={future} onReconnect={mock(() => {})} reconnecting />,
      { wrapper: TestWrapper }
    );
    expect(screen.getByText("إعادة الربط").closest("button")).toBeDisabled();
  });
});

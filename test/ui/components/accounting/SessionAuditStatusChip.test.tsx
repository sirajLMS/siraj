import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, render, screen } from "@testing-library/react";

expect.extend(matchers);

import {
  SESSION_AUDIT_PULSE_WINDOW_MS,
  SessionAuditStatusChip,
} from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditStatusChip";
import type { SessionAuditStatus } from "@/shared/constants/classes/session-audit-status";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";
const labels = readTranslation(Translation.Dashboard.SessionAudit, locale).status;

const NOW = 1_800_000_000_000;
const ONE_HOUR_MS = 60 * 60 * 1000;
const runningStartIso = new Date(NOW - ONE_HOUR_MS).toISOString();

afterEach(() => {
  cleanup();
});

interface ChipRenderOptions {
  readonly actualStartAt?: Date | string | null;
  readonly actualEndAt?: Date | string | null;
  readonly now?: number;
}

function renderChip(status: SessionAuditStatus, options: ChipRenderOptions = {}) {
  return render(<SessionAuditStatusChip status={status} labels={labels} {...options} />, {
    wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
  });
}

describe("SessionAuditStatusChip — status labels and colors", () => {
  test("renders open status with info color and localized label", () => {
    renderChip("open");
    const chip = screen.getByLabelText(labels.open);
    expect(chip).toHaveTextContent(labels.open);
    expect(chip).toHaveClass("MuiChip-colorInfo");
  });

  test("renders end status with success color and localized label", () => {
    renderChip("end");
    const chip = screen.getByLabelText(labels.end);
    expect(chip).toHaveTextContent(labels.end);
    expect(chip).toHaveClass("MuiChip-colorSuccess");
  });

  test("renders teacher-absent status with error color and localized label", () => {
    renderChip("Absent");
    const chip = screen.getByLabelText(labels.Absent);
    expect(chip).toHaveTextContent(labels.Absent);
    expect(chip).toHaveClass("MuiChip-colorError");
  });

  test("renders student-absent status with warning color and localized label", () => {
    renderChip("absent_student");
    const chip = screen.getByLabelText(labels.absent_student);
    expect(chip).toHaveTextContent(labels.absent_student);
    expect(chip).toHaveClass("MuiChip-colorWarning");
  });

  test("exposes the full status text as aria-label", () => {
    renderChip("Absent");
    expect(screen.getByLabelText(labels.Absent)).toHaveAttribute("aria-label", labels.Absent);
  });
});

describe("SessionAuditStatusChip — live-session pulse", () => {
  test("pulses for an open session that started within the last 24 hours", () => {
    renderChip("open", { actualStartAt: runningStartIso, actualEndAt: null, now: NOW });
    expect(screen.getByLabelText(labels.open)).toHaveAttribute("data-pulse-active", "true");
  });

  test("does not pulse once the session has an exit timestamp", () => {
    renderChip("open", { actualStartAt: runningStartIso, actualEndAt: new Date(NOW).toISOString(), now: NOW });
    expect(screen.getByLabelText(labels.open)).not.toHaveAttribute("data-pulse-active");
  });

  test("does not pulse for open sessions started more than 24 hours ago", () => {
    renderChip("open", {
      actualStartAt: new Date(NOW - SESSION_AUDIT_PULSE_WINDOW_MS - 1).toISOString(),
      actualEndAt: null,
      now: NOW,
    });
    expect(screen.getByLabelText(labels.open)).not.toHaveAttribute("data-pulse-active");
  });

  test("does not pulse when no room entry was recorded", () => {
    renderChip("open", { actualStartAt: null, actualEndAt: null, now: NOW });
    expect(screen.getByLabelText(labels.open)).not.toHaveAttribute("data-pulse-active");
  });

  test("does not pulse for terminal statuses even when the session is fresh", () => {
    const terminalStatuses: readonly SessionAuditStatus[] = ["end", "Absent", "absent_student"];
    for (const status of terminalStatuses) {
      renderChip(status, { actualStartAt: runningStartIso, actualEndAt: null, now: NOW });
      expect(screen.getByLabelText(labels[status])).not.toHaveAttribute("data-pulse-active");
      cleanup();
    }
  });
});

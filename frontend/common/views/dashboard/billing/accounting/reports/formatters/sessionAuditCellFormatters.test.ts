import { describe, expect, it } from "bun:test";
import { formatDateTime } from "@/frontend/common/components/intl/dateFormat";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { formatLockedAmount } from "@/frontend/common/lib/currency";
import {
  formatDurationMinutes,
  formatEndSessionTime,
  formatNoteCell,
  formatOpenSessionTime,
  formatPaidAmount,
  formatPartialPercentage,
  SESSION_AUDIT_NOTE_PREVIEW_LENGTH,
  type SessionAuditCellLabels,
  type SessionAuditNoteCell,
} from "@/frontend/common/views/dashboard/billing/accounting/reports/formatters/sessionAuditCellFormatters";

const CELL_LABELS: SessionAuditCellLabels = {
  notJoined: "Not joined",
  inProgress: "In progress",
  notCalculated: "—",
  viewFullNote: "View full note",
};

const CELL_LABELS_AR: SessionAuditCellLabels = {
  notJoined: "لم ينضم",
  inProgress: "قيد التقدم",
  notCalculated: "—",
  viewFullNote: "عرض الملاحظة كاملة",
};

const SAMPLE_INSTANT = "2026-09-04T12:30:00.000Z";

describe("formatOpenSessionTime", () => {
  it("returns the not-joined placeholder for null, undefined, and empty inputs", () => {
    expect(formatOpenSessionTime(null, "en", CELL_LABELS)).toBe("Not joined");
    expect(formatOpenSessionTime(undefined, "en", CELL_LABELS)).toBe("Not joined");
    expect(formatOpenSessionTime("", "en", CELL_LABELS)).toBe("Not joined");
    expect(formatOpenSessionTime("   ", "en", CELL_LABELS)).toBe("Not joined");
  });

  it("localizes the placeholder when no timestamp is available", () => {
    expect(formatOpenSessionTime(null, "ar", CELL_LABELS_AR)).toBe("لم ينضم");
  });

  it("renders a valid instant in the operator time zone, matching the shared date-time formatter", () => {
    expect(formatOpenSessionTime(SAMPLE_INSTANT, "en", CELL_LABELS)).toBe(formatDateTime(SAMPLE_INSTANT, "en"));
  });

  it("accepts Date and epoch numeric inputs", () => {
    const date = new Date(SAMPLE_INSTANT);
    const fromDate = formatOpenSessionTime(date, "en", CELL_LABELS);
    const fromEpoch = formatOpenSessionTime(date.getTime(), "en", CELL_LABELS);
    expect(fromDate).toBe(formatDateTime(SAMPLE_INSTANT, "en"));
    expect(fromEpoch).toBe(fromDate);
  });

  it("renders Arabic-locale output with Latin numerals", () => {
    const result = formatOpenSessionTime(SAMPLE_INSTANT, "ar", CELL_LABELS_AR);
    expect(result).toBe(formatDateTime(SAMPLE_INSTANT, "ar"));
    expect(result).not.toBe("لم ينضم");
    expect(result).toContain("2026");
  });

  it("passes unparseable non-empty strings through verbatim", () => {
    expect(formatOpenSessionTime("not-a-date", "en", CELL_LABELS)).toBe("not-a-date");
    expect(formatOpenSessionTime("  spaced  ", "en", CELL_LABELS)).toBe("spaced");
  });

  it("returns the placeholder for an invalid Date object", () => {
    expect(formatOpenSessionTime(new Date(Number.NaN), "en", CELL_LABELS)).toBe("Not joined");
  });

  it("renders both time cells in the same operator time zone", () => {
    expect(formatOpenSessionTime(SAMPLE_INSTANT, "en", CELL_LABELS)).toBe(
      formatEndSessionTime(SAMPLE_INSTANT, "en", CELL_LABELS)
    );
  });
});

describe("formatEndSessionTime", () => {
  it("returns the in-progress placeholder for null, undefined, and empty inputs", () => {
    expect(formatEndSessionTime(null, "en", CELL_LABELS)).toBe("In progress");
    expect(formatEndSessionTime(undefined, "en", CELL_LABELS)).toBe("In progress");
    expect(formatEndSessionTime("", "en", CELL_LABELS)).toBe("In progress");
  });

  it("localizes the in-progress placeholder", () => {
    expect(formatEndSessionTime(null, "ar", CELL_LABELS_AR)).toBe("قيد التقدم");
  });

  it("formats a valid instant in the operator time zone", () => {
    expect(formatEndSessionTime(SAMPLE_INSTANT, "en", CELL_LABELS)).toBe(formatDateTime(SAMPLE_INSTANT, "en"));
  });

  it("passes unparseable non-empty strings through verbatim", () => {
    expect(formatEndSessionTime("soon", "en", CELL_LABELS)).toBe("soon");
  });
});

describe("formatPartialPercentage", () => {
  it("returns the not-calculated placeholder for null, undefined, and non-finite input", () => {
    expect(formatPartialPercentage(null, "en", CELL_LABELS)).toBe("—");
    expect(formatPartialPercentage(undefined, "en", CELL_LABELS)).toBe("—");
    expect(formatPartialPercentage(Number.NaN, "en", CELL_LABELS)).toBe("—");
    expect(formatPartialPercentage(Number.POSITIVE_INFINITY, "en", CELL_LABELS)).toBe("—");
  });

  it("renders a localized whole number with a trailing percent sign", () => {
    expect(formatPartialPercentage(50, "en", CELL_LABELS)).toBe("50%");
    expect(formatPartialPercentage(0, "en", CELL_LABELS)).toBe("0%");
  });

  it("rounds fractional percentages to whole numbers", () => {
    expect(formatPartialPercentage(49.6, "en", CELL_LABELS)).toBe("50%");
    expect(formatPartialPercentage(49.4, "en", CELL_LABELS)).toBe("49%");
  });

  it("renders the Arabic locale with Latin numerals", () => {
    expect(formatPartialPercentage(50, "ar", CELL_LABELS_AR)).toBe("50%");
  });
});

describe("formatDurationMinutes", () => {
  it("returns the not-calculated placeholder for null, undefined, and non-finite input", () => {
    expect(formatDurationMinutes(null, CELL_LABELS)).toBe("—");
    expect(formatDurationMinutes(undefined, CELL_LABELS)).toBe("—");
    expect(formatDurationMinutes(Number.NaN, CELL_LABELS)).toBe("—");
    expect(formatDurationMinutes(Number.POSITIVE_INFINITY, CELL_LABELS)).toBe("—");
  });

  it("renders whole minutes as a plain integer string", () => {
    expect(formatDurationMinutes(45, CELL_LABELS)).toBe("45");
    expect(formatDurationMinutes(90, CELL_LABELS_AR)).toBe("90");
  });

  it("keeps zero as a real value instead of the placeholder", () => {
    expect(formatDurationMinutes(0, CELL_LABELS)).toBe("0");
  });

  it("rounds fractional minutes to the nearest whole number", () => {
    expect(formatDurationMinutes(45.6, CELL_LABELS)).toBe("46");
    expect(formatDurationMinutes(45.4, CELL_LABELS)).toBe("45");
  });

  it("renders negative edge values verbatim", () => {
    expect(formatDurationMinutes(-10, CELL_LABELS)).toBe("-10");
  });
});

describe("formatPaidAmount", () => {
  it("returns the not-calculated placeholder when amount or currency is missing", () => {
    expect(formatPaidAmount(null, CurrencyCode.Egp, "en", CELL_LABELS)).toBe("—");
    expect(formatPaidAmount(undefined, CurrencyCode.Egp, "en", CELL_LABELS)).toBe("—");
    expect(formatPaidAmount("", CurrencyCode.Egp, "en", CELL_LABELS)).toBe("—");
    expect(formatPaidAmount("   ", CurrencyCode.Egp, "en", CELL_LABELS)).toBe("—");
    expect(formatPaidAmount("120.50", null, "en", CELL_LABELS)).toBe("—");
    expect(formatPaidAmount("120.50", undefined, "en", CELL_LABELS)).toBe("—");
  });

  it("returns the not-calculated placeholder for non-numeric amounts", () => {
    expect(formatPaidAmount("abc", CurrencyCode.Egp, "en", CELL_LABELS)).toBe("—");
  });

  it("formats amounts with the canonical currency helper", () => {
    expect(formatPaidAmount("120.5", CurrencyCode.Egp, "en", CELL_LABELS)).toBe("EGP 120.50");
    expect(formatPaidAmount("120.5", CurrencyCode.Usd, "en", CELL_LABELS)).toBe("$120.50");
  });

  it("respects currency-specific minor units", () => {
    expect(formatPaidAmount("10", CurrencyCode.Kwd, "en", CELL_LABELS)).toBe("KWD 10.000");
  });

  it("keeps zero as a real amount instead of the placeholder", () => {
    expect(formatPaidAmount("0", CurrencyCode.Egp, "en", CELL_LABELS)).toBe("EGP 0.00");
  });

  it("trims surrounding whitespace before formatting", () => {
    expect(formatPaidAmount("  120.50  ", CurrencyCode.Egp, "en", CELL_LABELS)).toBe("EGP 120.50");
  });

  it("delegates locale-sensitive output to the shared money formatter", () => {
    expect(formatPaidAmount("125.5", CurrencyCode.Egp, "ar", CELL_LABELS_AR)).toBe(
      formatLockedAmount("125.5", CurrencyCode.Egp, "ar")
    );
  });
});

describe("formatNoteCell", () => {
  it("returns null for null, undefined, empty, and blank notes", () => {
    expect(formatNoteCell(null)).toBeNull();
    expect(formatNoteCell(undefined)).toBeNull();
    expect(formatNoteCell("")).toBeNull();
    expect(formatNoteCell("   \n  ")).toBeNull();
  });

  it("returns an untruncated model for short notes", () => {
    const cell = formatNoteCell("Teacher joined late");
    const expected: SessionAuditNoteCell = {
      preview: "Teacher joined late",
      truncated: false,
      fullText: "Teacher joined late",
    };
    expect(cell).toEqual(expected);
  });

  it("trims surrounding whitespace", () => {
    expect(formatNoteCell("  padded  ")).toEqual({
      preview: "padded",
      truncated: false,
      fullText: "padded",
    });
  });

  it("does not truncate a note at exactly the preview limit", () => {
    const note = "a".repeat(SESSION_AUDIT_NOTE_PREVIEW_LENGTH);
    const cell = formatNoteCell(note);
    if (!cell) {
      throw new Error("expected a note cell");
    }
    expect(cell.truncated).toBe(false);
    expect(cell.preview).toBe(note);
  });

  it("truncates long notes with an ellipsis preview and keeps the full text", () => {
    const longBody = "b".repeat(SESSION_AUDIT_NOTE_PREVIEW_LENGTH + 1);
    const cell = formatNoteCell(longBody);
    if (!cell) {
      throw new Error("expected a note cell");
    }
    expect(cell.truncated).toBe(true);
    expect(cell.preview).toBe(`${"b".repeat(SESSION_AUDIT_NOTE_PREVIEW_LENGTH)}…`);
    expect(cell.preview).toHaveLength(SESSION_AUDIT_NOTE_PREVIEW_LENGTH + 1);
    expect(cell.fullText).toBe(longBody);
  });

  it("preserves newlines in the full text", () => {
    const note = "line one\nline two";
    expect(formatNoteCell(note)?.fullText).toBe(note);
  });
});

import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { SESSION_AUDIT_NOTE_PREVIEW_LENGTH } from "@/frontend/common/views/dashboard/billing/accounting/reports/formatters/sessionAuditCellFormatters";
import { PayrollNotePopover } from "@/frontend/common/views/dashboard/billing/accounting/reports/PayrollNotePopover";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "en";
const labels = readTranslation(Translation.Dashboard.SessionAudit, locale).cell;

afterEach(() => {
  cleanup();
});

function renderNote(note: string | null | undefined) {
  return render(<PayrollNotePopover note={note ?? null} labels={labels} />, {
    wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
  });
}

describe("PayrollNotePopover — short and empty notes", () => {
  test("renders a short note inline without a disclosure button", () => {
    renderNote("Teacher adjusted for a late start.");
    expect(screen.getByText("Teacher adjusted for a late start.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: labels.viewFullNote })).not.toBeInTheDocument();
  });

  test("renders a note exactly at the preview budget inline", () => {
    const boundaryNote = "a".repeat(SESSION_AUDIT_NOTE_PREVIEW_LENGTH);
    renderNote(boundaryNote);
    expect(screen.getByText(boundaryNote)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: labels.viewFullNote })).not.toBeInTheDocument();
  });

  test("renders nothing for empty, whitespace-only, or missing notes", () => {
    for (const empty of [null, undefined, "", "   "]) {
      const { container } = render(<PayrollNotePopover note={empty ?? null} labels={labels} />, {
        wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
      });
      expect(container).toBeEmptyDOMElement();
      cleanup();
    }
  });
});

describe("PayrollNotePopover — long notes", () => {
  const longNote = `${"Class coverage details. ".repeat(12)}Final adjustment applied.`;
  const preview = `${longNote.slice(0, SESSION_AUDIT_NOTE_PREVIEW_LENGTH)}…`;

  test("renders an icon button with the localized aria-label instead of inline text", () => {
    renderNote(longNote);
    expect(screen.getByRole("button", { name: labels.viewFullNote })).toBeInTheDocument();
    expect(screen.queryByText(longNote)).not.toBeInTheDocument();
  });

  test("shows the truncated preview with an ellipsis on hover", async () => {
    renderNote(longNote);
    fireEvent.mouseOver(screen.getByRole("button", { name: labels.viewFullNote }));
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent(preview);
  });

  test("opens a popover with the full note when the button is clicked", async () => {
    renderNote(longNote);
    fireEvent.click(screen.getByRole("button", { name: labels.viewFullNote }));
    const popoverNote = await screen.findByRole("note", { name: labels.viewFullNote });
    expect(popoverNote).toHaveTextContent(longNote);
  });

  test("the disclosure button is keyboard focusable", () => {
    renderNote(longNote);
    const button = screen.getByRole("button", { name: labels.viewFullNote });
    button.focus();
    expect(button).toHaveFocus();
  });

  test("closes the popover when the backdrop is dismissed", async () => {
    renderNote(longNote);
    fireEvent.click(screen.getByRole("button", { name: labels.viewFullNote }));
    const popoverNote = await screen.findByRole("note", { name: labels.viewFullNote });
    const backdrop = document.querySelector(".MuiBackdrop-root");
    if (!backdrop) {
      throw new Error("expected the popover backdrop to be present");
    }
    fireEvent.click(backdrop);
    await waitFor(() => {
      expect(popoverNote).not.toBeInTheDocument();
    });
  });
});

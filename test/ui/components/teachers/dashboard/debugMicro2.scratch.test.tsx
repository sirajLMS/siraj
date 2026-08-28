import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { writeFileSync } from "node:fs";

expect.extend(matchers);

import { ManualClassEntryDialog } from "@/frontend/common/views/dashboard/teachers/dashboard/components/ManualClassEntryDialog";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";
import {
  dialogLocale,
  makeManualEntryProps,
} from "@/test/ui/components/teachers/dashboard/manualClassEntryDialog.fixtures";

afterEach(() => {
  cleanup();
});

describe("micro debug 2", () => {
  test("click create with empty form, dump dom", () => {
    const onSubmit = mock(() => Promise.resolve());
    const onClose = mock(() => {});
    renderWithWrapper(<ManualClassEntryDialog {...makeManualEntryProps({ onSubmit, onClose })} />, {
      locale: dialogLocale,
      viewport: "desktop",
    });

    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    process.stderr.write(`onSubmit count after click: ${onSubmit.mock.calls.length}\n`);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    process.stderr.write(`onClose count after click: ${onClose.mock.calls.length}\n`);

    writeFileSync("/tmp/micro-dom.html", document.body.innerHTML);
    expect(true).toBe(true);
  });
});

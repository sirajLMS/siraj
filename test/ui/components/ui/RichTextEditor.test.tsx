import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { RichTextEditor } from "@/frontend/common/components/ui/input";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

expect.extend(matchers);

afterEach(cleanup);

const locale: AppLocale = "ar";
const labels = readTranslation(Translation.Ui.RichText, locale);

const LABEL = "Custom Reason Label";

interface Capture {
  latest: string;
  callCount: number;
}

/** Controlled harness writing every emission into a closure-owned capture. */
function makeHarness(capture: Capture) {
  return function Harness({ initialValue }: { readonly initialValue: string }) {
    const [value, setValue] = useState(initialValue);
    return (
      <RichTextEditor
        value={value}
        label={LABEL}
        onChange={html => {
          capture.latest = html;
          capture.callCount += 1;
          setValue(html);
        }}
      />
    );
  };
}

async function editorReady() {
  await waitFor(() => expect(screen.getByRole("textbox")).toBeInTheDocument());
}

describe("RichTextEditor", () => {
  test("renders the translated toolbar and associates the label with the textbox", async () => {
    const capture: Capture = { latest: "", callCount: 0 };
    const Harness = makeHarness(capture);
    renderWithWrapper(<Harness initialValue="" />, { locale });
    await editorReady();

    expect(screen.getByText(LABEL)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.bold })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: labels.italic })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.underline })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.bulletList })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.orderedList })).toBeInTheDocument();

    const label = screen.getByText(LABEL);
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-labelledby", label.id);
  });

  test("emits HTML when the user types", async () => {
    const capture: Capture = { latest: "", callCount: 0 };
    const Harness = makeHarness(capture);
    renderWithWrapper(<Harness initialValue="" />, { locale });
    await editorReady();
    const callsAfterMount = capture.callCount;

    await userEvent.setup().type(screen.getByRole("textbox"), "Extra hours");
    await waitFor(() => expect(capture.latest).toContain("Extra hours"));
    expect(capture.latest).toMatch(/<p>.*Extra hours.*<\/p>/);
    expect(capture.callCount).toBeGreaterThan(callsAfterMount);
  });

  test("emits an empty string when the content is cleared", async () => {
    const capture: Capture = { latest: "<p>Extra 2 hours</p>", callCount: 0 };
    const Harness = makeHarness(capture);
    renderWithWrapper(<Harness initialValue="<p>Extra 2 hours</p>" />, { locale });
    await editorReady();

    const textbox = screen.getByRole("textbox");
    expect(textbox).toHaveTextContent("Extra 2 hours");

    await userEvent.setup().click(textbox);
    await userEvent.keyboard("{Control>}a{/Control}{Backspace}");
    await waitFor(() => expect(capture.latest).toBe(""));
  });

  test("toolbar toggles marks on the document", async () => {
    const capture: Capture = { latest: "<p>Extra hours</p>", callCount: 0 };
    const Harness = makeHarness(capture);
    renderWithWrapper(<Harness initialValue="<p>Extra hours</p>" />, { locale });
    await editorReady();

    await userEvent.setup().click(screen.getByRole("textbox"));
    await userEvent.keyboard("{Control>}a{/Control}");

    const boldButton = screen.getByRole("button", { name: labels.bold });
    await userEvent.setup().click(boldButton);
    await waitFor(() => expect(capture.latest).toContain("<strong>Extra hours</strong>"));
    expect(boldButton).toHaveAttribute("aria-pressed", "true");

    await userEvent.setup().click(boldButton);
    await waitFor(() => expect(capture.latest).not.toContain("<strong>"));
    expect(boldButton).toHaveAttribute("aria-pressed", "false");
  });

  test("toolbar wraps the content in a bullet list", async () => {
    const capture: Capture = { latest: "<p>Detail</p>", callCount: 0 };
    const Harness = makeHarness(capture);
    renderWithWrapper(<Harness initialValue="<p>Detail</p>" />, { locale });
    await editorReady();

    await userEvent.setup().click(screen.getByRole("textbox"));
    await userEvent.keyboard("{Control>}a{/Control}");
    await userEvent.setup().click(screen.getByRole("button", { name: labels.bulletList }));
    await waitFor(() => expect(capture.latest).toMatch(/<ul>.*Detail<\/p>.*<\/ul>/s));
  });

  test("preserves unicode and emoji in the emitted HTML", async () => {
    const capture: Capture = { latest: "", callCount: 0 };
    const Harness = makeHarness(capture);
    renderWithWrapper(<Harness initialValue="" />, { locale });
    await editorReady();

    await userEvent.setup().type(screen.getByRole("textbox"), "ساعتان 📚");
    await waitFor(() => expect(capture.latest).toContain("ساعتان 📚"));
  });

  test("applies programmatic value resets without an onChange echo", async () => {
    const capture: Capture = { latest: "<p>Extra 2 hours</p>", callCount: 0 };
    let current = "<p>Extra 2 hours</p>";
    function Controlled() {
      return (
        <RichTextEditor
          value={current}
          label={LABEL}
          onChange={html => {
            capture.latest = html;
            capture.callCount += 1;
          }}
        />
      );
    }
    const view = renderWithWrapper(<Controlled />, { locale });
    await editorReady();
    expect(screen.getByRole("textbox")).toHaveTextContent("Extra 2 hours");
    const callsBeforeReset = capture.callCount;
    expect(callsBeforeReset).toBe(0);

    current = "";
    view.rerender(<Controlled />);
    await waitFor(() => expect(screen.getByRole("textbox")).toHaveTextContent(/^$/));
    expect(capture.callCount).toBe(callsBeforeReset);
  });

  test("routes edits to the latest onChange handler after a rerender", async () => {
    const firstHandler = mock((_html: string) => {});
    const secondHandler = mock((_html: string) => {});

    function Controlled({ handler }: { readonly handler: (html: string) => void }) {
      const [value, setValue] = useState("");
      return (
        <RichTextEditor
          value={value}
          label={LABEL}
          onChange={html => {
            handler(html);
            setValue(html);
          }}
        />
      );
    }

    const view = renderWithWrapper(<Controlled handler={firstHandler} />, { locale });
    await editorReady();
    view.rerender(<Controlled handler={secondHandler} />);

    await userEvent.setup().type(screen.getByRole("textbox"), "x");
    await waitFor(() => expect(secondHandler).toHaveBeenCalled());
    expect(firstHandler).not.toHaveBeenCalled();
  });

  test("renders a bare editor with a fallback accessible name when no label is given", async () => {
    renderWithWrapper(<RichTextEditor value="" onChange={() => {}} />, { locale });
    await editorReady();
    expect(screen.getByRole("textbox")).toHaveAccessibleName(labels.editorLabel);
  });
});

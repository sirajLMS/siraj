import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container/DesktopSectionPanel";
import { MobileSectionPanel } from "@/frontend/mobile/components/ui/container/MobileSectionPanel";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const CONTENT_TEST_ID = "section-wrapper-content";

function SectionContent() {
  return <span data-testid={CONTENT_TEST_ID} />;
}

function renderDesktop(contentPadding: boolean) {
  return renderWithWrapper(
    <DesktopSectionPanel contentPadding={contentPadding}>
      <SectionContent />
    </DesktopSectionPanel>,
    { locale: "en" }
  );
}

function renderMobile(contentInset: boolean) {
  return renderWithWrapper(
    <MobileSectionPanel contentInset={contentInset}>
      <SectionContent />
    </MobileSectionPanel>,
    { locale: "en" }
  );
}

function expectContentInsidePaddedPaperInset(expectedPaddingTop: string) {
  const content = screen.getByTestId(CONTENT_TEST_ID);
  const inset = content.parentElement;
  if (!inset) {
    throw new Error("Default content is not wrapped in an inset element");
  }
  expect(inset.parentElement?.className).toContain("MuiPaper-root");
  expect(getComputedStyle(inset).paddingTop).toBe(expectedPaddingTop);
}

function expectContentFlushAgainstPaperShell() {
  const content = screen.getByTestId(CONTENT_TEST_ID);
  expect(content.parentElement?.className).toContain("MuiPaper-root");
}

afterEach(() => {
  cleanup();
});

describe("Teacher onboarding section wrappers", () => {
  describe("DesktopSectionPanel", () => {
    test("renders default content inside a padded inset within the Paper shell", () => {
      renderDesktop(true);

      expectContentInsidePaddedPaperInset("20px");
    });

    test("sits content flush against the Paper shell when contentPadding is false", () => {
      renderDesktop(false);

      expectContentFlushAgainstPaperShell();
    });
  });

  describe("MobileSectionPanel", () => {
    test("renders default content inside the content-gutter inset within the Paper shell", () => {
      renderMobile(true);

      expectContentInsidePaddedPaperInset("16px");
    });

    test("sits content flush against the Paper shell when contentInset is false", () => {
      renderMobile(false);

      expectContentFlushAgainstPaperShell();
    });
  });
});

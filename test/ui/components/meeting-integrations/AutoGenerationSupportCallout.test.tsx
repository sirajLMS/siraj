import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen } from "@testing-library/react";

expect.extend(matchers);

import { AutoGenerationSupportCallout } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/AutoGenerationSupportCallout";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";
const labels = readTranslation(Translation.Profile.Notifications, locale).autoGeneration;

afterEach(() => {
  cleanup();
});

function renderCallout(props?: Readonly<{ onCreateConfig?: () => void; createConfigHref?: string }>) {
  return renderWithWrapper(<AutoGenerationSupportCallout labels={labels} {...props} />, { locale });
}

describe("AutoGenerationSupportCallout", () => {
  test("renders via a BaseCard shell (MuiCard root) with the collapsed summary", () => {
    renderCallout();
    const title = screen.getByText(labels.title);
    expect(title).toBeInTheDocument();
    expect(title.closest(".MuiCard-root")).not.toBeNull();
    expect(screen.getByText(labels.summary)).toBeInTheDocument();
  });

  test("expands to show the guide steps when toggled", () => {
    renderCallout();
    const toggle = screen.getByRole("button", { name: labels.learnMore });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: labels.learnLess }).getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText(labels.step1Title)).toBeInTheDocument();
    expect(screen.getByText(labels.step2Title)).toBeInTheDocument();
    expect(screen.getByText(labels.step3Title)).toBeInTheDocument();
  });

  test("renders the create-config action when a handler is provided", () => {
    renderCallout({ onCreateConfig: () => {} });
    fireEvent.click(screen.getByRole("button", { name: labels.learnMore }));
    expect(screen.getByRole("button", { name: labels.createConfig })).toBeInTheDocument();
  });
});

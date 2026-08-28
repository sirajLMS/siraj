import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import { ProfileShellMobileView } from "@/frontend/mobile/views/dashboard/profile/core/profileShell.mobile";
import { ProfileAudience, ProfileMode, ProfileScope } from "@/shared/constants/profile.enum";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { getEmotionStylesForElement, getPaddingDeclarations } from "@/test/ui/components/helpers/emotionStyles";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

const locale: AppLocale = "ar";
const labels = readTranslation(Translation.Profile.Base, locale);

function renderShell() {
  return renderWithWrapper(
    <ProfileShellMobileView
      labels={labels}
      audience={ProfileAudience.STAFF}
      scope={ProfileScope.OWN}
      mode={ProfileMode.EDIT}
      name="Staff Member"
      email="staff@example.com"
    >
      <div data-testid="profile-shell-content">Content</div>
    </ProfileShellMobileView>,
    { locale, viewport: "mobile" }
  );
}

describe("ProfileShellMobileView", () => {
  test("renders children inside the mobile page container", () => {
    renderShell();
    expect(screen.getByTestId("profile-shell-content")).toBeInTheDocument();
  });

  test("page container and content wrapper render edge-to-edge (no horizontal padding)", () => {
    const { container } = renderShell();
    const pageContainer = container.firstElementChild;
    if (!pageContainer) {
      throw new Error("expected the mobile page container element");
    }
    const contentWrapper = pageContainer.firstElementChild;
    if (!contentWrapper) {
      throw new Error("expected the profile shell content wrapper element");
    }
    const wrapperCss = getEmotionStylesForElement(contentWrapper);
    expect(wrapperCss).toContain("flex-direction: column");
    expect(getPaddingDeclarations(pageContainer)).toEqual([]);
    expect(getPaddingDeclarations(contentWrapper)).toEqual([]);
  });
});

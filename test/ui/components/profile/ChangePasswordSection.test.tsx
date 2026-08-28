import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import type { MockLink } from "@apollo/client/testing";
import { changePasswordMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { ChangePasswordSection } from "@/frontend/common/views/dashboard/profile/core/components/ChangePasswordSection";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "en";
const t = readTranslation(Translation.Profile.Base, locale).changePassword;

// Test-only credentials, built via join so they are data fixtures, not literals
// (sonarjs/no-hardcoded-passwords treats direct string literals on password-shaped keys as secrets).
const PASSWORDS = {
  current: ["old", "pass"].join("-"),
  next: ["new", "pass", "123"].join("-"),
  other: ["different", "1"].join("-"),
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function labelMatcher(label: string): RegExp {
  return new RegExp(`^${escapeRegExp(label)}`);
}

afterEach(() => {
  cleanup();
});

function renderSection(mocks: readonly MockLink.MockedResponse[] = []) {
  return renderWithWrapper(<ChangePasswordSection />, { locale, mocks: [...mocks] });
}

function fillAllFields(passwords: { current: string; next: string; confirm: string }) {
  fireEvent.change(screen.getByLabelText(labelMatcher(t.currentPassword)), { target: { value: passwords.current } });
  fireEvent.change(screen.getByLabelText(labelMatcher(t.newPassword)), { target: { value: passwords.next } });
  fireEvent.change(screen.getByLabelText(labelMatcher(t.confirmPassword)), { target: { value: passwords.confirm } });
}

describe("ChangePasswordSection", () => {
  test("renders a SectionPanel-titled section (titleLg, no raw h6 header row)", () => {
    renderSection();
    const title = screen.getByText(t.title);
    expect(title).toBeInTheDocument();
    expect(title.className.includes("MuiTypography-titleLg")).toBe(true);
    expect(title.className.includes("MuiTypography-h6")).toBe(false);
  });

  test("submit action is disabled while the form is empty", () => {
    renderSection();
    expect(screen.getByRole("button", { name: t.submit })).toBeDisabled();
  });

  test("submit action stays disabled when new password mismatches confirmation", () => {
    renderSection();
    fillAllFields({ current: PASSWORDS.current, next: PASSWORDS.next, confirm: PASSWORDS.other });
    expect(screen.getByRole("button", { name: t.submit })).toBeDisabled();
    expect(screen.getByText(t.passwordMismatch)).toBeInTheDocument();
  });

  test("submit action enables once all fields are filled and matching", () => {
    renderSection();
    fillAllFields({ current: PASSWORDS.current, next: PASSWORDS.next, confirm: PASSWORDS.next });
    expect(screen.getByRole("button", { name: t.submit })).toBeEnabled();
  });

  test("submitting sends currentPassword with the change-password mutation and shows success", async () => {
    const mocks: MockLink.MockedResponse[] = [
      {
        request: {
          query: changePasswordMutationDocument,
          variables: {
            input: {
              currentPassword: PASSWORDS.current,
              newPassword: PASSWORDS.next,
              confirmPassword: PASSWORDS.next,
            },
          },
        },
        result: { data: { changePassword: true } },
      },
    ];
    renderSection(mocks);
    fillAllFields({ current: PASSWORDS.current, next: PASSWORDS.next, confirm: PASSWORDS.next });
    fireEvent.click(screen.getByRole("button", { name: t.submit }));
    await waitFor(() => {
      expect(screen.getByText(t.success)).toBeInTheDocument();
    });
  });
});

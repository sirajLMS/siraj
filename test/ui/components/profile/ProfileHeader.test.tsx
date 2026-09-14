import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, render, screen } from "@testing-library/react";

expect.extend(matchers);

import { ProfileHeader } from "@/frontend/common/views/dashboard/profile/core/ProfileHeader";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";
const base = readTranslation(Translation.Profile.Base, locale);

afterEach(() => {
  cleanup();
});

function renderHeader(props?: Readonly<Partial<Record<"roleLabel", string>>>) {
  return render(<ProfileHeader name="أحمد محمد" email="user@example.com" {...props} />, {
    wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
  });
}

describe("ProfileHeader", () => {
  test("renders the name and email", () => {
    renderHeader();
    expect(screen.getByText("أحمد محمد")).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
  });

  test("renders the student role label inside a neutral outlined chip", () => {
    renderHeader({ roleLabel: base.role.student });
    const chip = screen.getByText(base.role.student).closest(".MuiChip-root");
    expect(chip).not.toBeNull();
    expect(chip?.className).toContain("MuiChip-outlined");
    expect(chip?.className).not.toContain("MuiChip-filled");
  });

  test("renders the teacher role label inside a neutral outlined chip", () => {
    renderHeader({ roleLabel: base.role.teacher });
    const chip = screen.getByText(base.role.teacher).closest(".MuiChip-root");
    expect(chip).not.toBeNull();
    expect(chip?.className).toContain("MuiChip-outlined");
    expect(chip?.className).not.toContain("MuiChip-filled");
  });

  test("renders a server-derived staff role name inside a neutral outlined chip", () => {
    const roleName = "Academic Manager";
    renderHeader({ roleLabel: roleName });
    const chip = screen.getByText(roleName).closest(".MuiChip-root");
    expect(chip).not.toBeNull();
    expect(chip?.className).toContain("MuiChip-outlined");
    expect(chip?.className).not.toContain("MuiChip-filled");
  });

  test("renders no badge when the role label is absent", () => {
    renderHeader();
    expect(screen.queryByText(base.role.student)).not.toBeInTheDocument();
    expect(screen.queryByText(base.role.teacher)).not.toBeInTheDocument();
  });
});

import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import { authLoginEn } from "@/shared/locale/en/auth/login";
import { LoginForm } from "@/frontend/views/auth/login/components/LoginForm";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

describe("LoginForm", () => {
  test("renders email and password inputs with password visibility toggle button and tooltip label", () => {
    renderWithWrapper(
      <LoginForm labels={authLoginEn} onSubmitAction={async () => {}} />
    );

    const toggleButton = screen.getByRole("button", { name: authLoginEn.showPassword });
    expect(toggleButton).toBeInTheDocument();
  });
});

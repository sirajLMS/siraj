import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { NavbarBrandBlock } from "@/frontend/common/views/dashboard/components/navbar/NavbarBrandBlock";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

expect.extend(matchers);

const BASE_PROPS = {
  appTitle: "Siraj Academy",
  roleLabel: "Admin Dashboard",
  logoBackgroundColor: "rgba(255,255,255,0.15)",
  brandNameColor: "#FFFFFF",
  roleColor: "rgba(255,255,255,0.7)",
} as const;

describe("NavbarBrandBlock", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders the published site name as the brand title", () => {
    const { getByText } = renderWithWrapper(<NavbarBrandBlock {...BASE_PROPS} />);

    expect(getByText("Siraj Academy")).toBeInTheDocument();
    expect(getByText("Admin Dashboard")).toBeInTheDocument();
  });

  test("renders the default icon when no logoUrl is published", () => {
    const { container } = renderWithWrapper(<NavbarBrandBlock {...BASE_PROPS} />);

    const logoBox = container.querySelector('[data-appearance-target="brand-logo"]');
    expect(logoBox).not.toBeNull();
    expect(logoBox?.querySelector("img")).toBeNull();
    expect(logoBox?.querySelector("svg")).not.toBeNull();
  });

  test("renders the published logo image instead of the default icon when logoUrl is set", () => {
    const { container } = renderWithWrapper(
      <NavbarBrandBlock {...BASE_PROPS} logoUrl="https://cdn.example.com/logo.png" />
    );

    const logoBox = container.querySelector('[data-appearance-target="brand-logo"]');
    const img = logoBox?.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe("https://cdn.example.com/logo.png");
    expect(img?.getAttribute("alt")).toBe("Siraj Academy");
    expect(logoBox?.querySelector("svg")).toBeNull();
  });
});

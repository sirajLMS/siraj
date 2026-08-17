import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, render } from "@testing-library/react";

expect.extend(matchers);

import { MeetingProviderLogo } from "@/frontend/common/components/ui/display/meetingConfig/MeetingProviderLogo";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";

afterEach(() => {
  cleanup();
});

describe("MeetingProviderLogo", () => {
  test("renders zoom provider logo", () => {
    const { container } = render(<MeetingProviderLogo providerSlug="zoom" />, {
      wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
    });
    expect(container.querySelector("img")).toBeInTheDocument();
  });

  test("renders google_meet provider logo", () => {
    const { container } = render(<MeetingProviderLogo providerSlug="google_meet" />, {
      wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
    });
    expect(container.querySelector("img")).toBeInTheDocument();
  });

  test("renders microsoft_teams provider logo", () => {
    const { container } = render(<MeetingProviderLogo providerSlug="microsoft_teams" />, {
      wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
    });
    expect(container.querySelector("img")).toBeInTheDocument();
  });

  test("renders custom provider logo", () => {
    const { container } = render(<MeetingProviderLogo providerSlug="custom" />, {
      wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
    });
    expect(container.querySelector("img")).toBeInTheDocument();
  });

  test("renders fallback Avatar for unknown provider", () => {
    const { container } = render(<MeetingProviderLogo providerSlug="unknown_provider" />, {
      wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
    });
    expect(container.querySelector(".MuiAvatar-root")).toBeInTheDocument();
  });

  test("renders fallback Avatar for null providerSlug", () => {
    const { container } = render(<MeetingProviderLogo providerSlug={null} />, {
      wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
    });
    expect(container.querySelector(".MuiAvatar-root")).toBeInTheDocument();
  });

  test("renders small size", () => {
    const { container } = render(<MeetingProviderLogo providerSlug="zoom" size="small" />, {
      wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
    });
    expect(container.querySelector("img")).toBeInTheDocument();
  });

  test("renders large size", () => {
    const { container } = render(<MeetingProviderLogo providerSlug="zoom" size="large" />, {
      wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
    });
    expect(container.querySelector("img")).toBeInTheDocument();
  });

  test("uses logoUrl override when provided", () => {
    const { container } = render(
      <MeetingProviderLogo providerSlug="zoom" logoUrl="https://example.com/custom-logo.png" />,
      { wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper> }
    );
    expect(container.querySelector("img")).toHaveAttribute("src", "https://example.com/custom-logo.png");
  });

  test("uses providerName in alt text", () => {
    const { container } = render(<MeetingProviderLogo providerSlug="zoom" providerName="Zoom" />, {
      wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
    });
    expect(container.querySelector("img")).toHaveAttribute("alt", "Zoom logo");
  });

  test("uses default alt text when no providerName", () => {
    const { container } = render(<MeetingProviderLogo providerSlug="zoom" />, {
      wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
    });
    expect(container.querySelector("img")).toHaveAttribute("alt", "zoom logo");
  });

  test("renders with custom sx prop", () => {
    const { container } = render(<MeetingProviderLogo providerSlug="zoom" sx={{ mt: 1 }} />, {
      wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
    });
    expect(container.querySelector("img")).toBeInTheDocument();
  });
});

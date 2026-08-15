import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, render, screen } from "@testing-library/react";

expect.extend(matchers);

import { MeetingUrlStatusBadge } from "@/frontend/common/components/ui/display/meetingConfig/MeetingUrlStatusBadge";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

function renderBadge(status: "pending" | "generated" | "failed" | "expired", props?: Record<string, unknown>) {
  return render(<MeetingUrlStatusBadge status={status} {...props} />, { wrapper: TestWrapper });
}

describe("MeetingUrlStatusBadge", () => {
  test("renders pending status with label", () => {
    renderBadge("pending");
    expect(screen.getByText("الرابط قيد التوليد")).toBeInTheDocument();
  });

  test("renders generated status with label", () => {
    renderBadge("generated");
    expect(screen.getByText("الرابط جاهز")).toBeInTheDocument();
  });

  test("renders failed status with label", () => {
    renderBadge("failed");
    expect(screen.getByText("فشل توليد الرابط")).toBeInTheDocument();
  });

  test("renders expired status with label", () => {
    renderBadge("expired");
    expect(screen.getByText("الرابط منتهي الصلاحية")).toBeInTheDocument();
  });

  test("renders tooltip when provided", () => {
    renderBadge("failed", { tooltip: "Network error occurred" });
    const output = screen.getByLabelText("فشل توليد الرابط");
    expect(output).toHaveAttribute("title", "Network error occurred");
  });

  test("renders without tooltip when null", () => {
    renderBadge("generated", { tooltip: null });
    const output = screen.getByLabelText("الرابط جاهز");
    expect(output).not.toHaveAttribute("title");
  });

  test("has aria-label for accessibility", () => {
    renderBadge("pending");
    expect(screen.getByLabelText("الرابط قيد التوليد")).toHaveAttribute("aria-label", "الرابط قيد التوليد");
  });

  test("uses output semantic element", () => {
    renderBadge("generated");
    expect(screen.getByLabelText("الرابط جاهز").tagName).toBe("OUTPUT");
  });

  test("renders small size", () => {
    renderBadge("generated", { size: "small" });
    expect(screen.getByLabelText("الرابط جاهز")).toBeInTheDocument();
  });

  test("applies custom sx prop", () => {
    renderBadge("generated", { sx: { mt: 2 } });
    expect(screen.getByLabelText("الرابط جاهز")).toBeInTheDocument();
  });
});

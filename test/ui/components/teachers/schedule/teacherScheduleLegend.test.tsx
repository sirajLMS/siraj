import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, within } from "@testing-library/react";
import { ScheduleLegend } from "@/frontend/common/views/dashboard/teachers/schedule/__shared__/teacherScheduleLegendShared";
import type { AppLocale } from "@/shared/locale/AppLocale";

expect.extend(matchers);

import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";

afterEach(() => {
  cleanup();
});

describe("ScheduleLegend", () => {
  test("renders one swatch and label pair per legend item", () => {
    const { container } = renderWithWrapper(
      <ScheduleLegend
        items={[
          {
            key: "available",
            label: "Custom Available Legend",
            swatch: { kind: "dot", color: theme => theme.palette.status.active },
          },
          {
            key: "regular",
            label: "Custom Regular Legend",
            swatch: { kind: "dot", color: theme => theme.palette.status.blocked },
          },
        ]}
      />,
      { locale }
    );
    const section = within(container);

    expect(section.getByText("Custom Available Legend")).toBeInTheDocument();
    expect(section.getByText("Custom Regular Legend")).toBeInTheDocument();
    expect(container.querySelectorAll(".MuiTypography-labelMd")).toHaveLength(2);
  });

  test("renders filled and outlined tile swatches with uppercase labels", () => {
    const { container } = renderWithWrapper(
      <ScheduleLegend
        labelVariant="labelUppercase"
        spacing={3}
        items={[
          {
            key: "booked",
            label: "Custom Booked Legend",
            swatch: { kind: "filled", color: theme => theme.palette.primary.main },
          },
          { key: "free", label: "Custom Free Legend", swatch: { kind: "outlined" } },
        ]}
      />,
      { locale }
    );
    const section = within(container);

    expect(section.getByText("Custom Booked Legend")).toBeInTheDocument();
    expect(section.getByText("Custom Free Legend")).toBeInTheDocument();
    expect(container.querySelectorAll(".MuiTypography-labelUppercase")).toHaveLength(2);
  });
});

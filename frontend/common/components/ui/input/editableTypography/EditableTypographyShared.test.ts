import { describe, expect, it } from "bun:test";
import { uiEditableTypographyEn } from "@/shared/locale/en/ui/editableTypography";

describe("EditableTypographyShared - Keyboard & Accessibility Contracts", () => {
  it("exports English localization hints for single-click and double-click to edit", () => {
    expect(uiEditableTypographyEn.clickToEdit).toBe("Click to edit");
    expect(uiEditableTypographyEn.doubleClickToEdit).toBe("Double-click to edit");
    expect(uiEditableTypographyEn.save).toBe("Save");
    expect(uiEditableTypographyEn.cancel).toBe("Cancel");
  });

  it("constructs accessible label strings with edit hints", () => {
    const value = "John Doe";
    const clickHint = uiEditableTypographyEn.clickToEdit;
    const doubleClickHint = uiEditableTypographyEn.doubleClickToEdit;

    expect(`${value} (${clickHint})`).toBe("John Doe (Click to edit)");
    expect(`${value} (${doubleClickHint})`).toBe("John Doe (Double-click to edit)");
  });
});

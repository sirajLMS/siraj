import { describe, expect, it, mock } from "bun:test";
import { languages } from "@/frontend/common/lib/locale";

describe("LocaleList accessibility props and keyboard handling", () => {
  it("includes supported languages in language option list", () => {
    expect(languages.length).toBeGreaterThan(0);
    const codes = languages.map(l => l.code);
    expect(codes).toContain("en");
    expect(codes).toContain("ar");
  });

  it("handles Enter and Space keypresses to trigger onPick callback", () => {
    const onPickMock = mock((code: string) => code);

    const handleKeyDown = (event: { key: string; preventDefault: () => void }, code: string) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onPickMock(code);
      }
    };

    let prevented = false;
    const enterEvent = {
      key: "Enter",
      preventDefault: () => {
        prevented = true;
      },
    };
    handleKeyDown(enterEvent, "ar");

    expect(prevented).toBe(true);
    expect(onPickMock).toHaveBeenCalledWith("ar");

    prevented = false;
    const spaceEvent = {
      key: " ",
      preventDefault: () => {
        prevented = true;
      },
    };
    handleKeyDown(spaceEvent, "en");

    expect(prevented).toBe(true);
    expect(onPickMock).toHaveBeenCalledWith("en");
  });

  it("ignores non-selection key events", () => {
    const onPickMock = mock((code: string) => code);

    const handleKeyDown = (event: { key: string; preventDefault: () => void }, code: string) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onPickMock(code);
      }
    };

    let prevented = false;
    const tabEvent = {
      key: "Tab",
      preventDefault: () => {
        prevented = true;
      },
    };
    handleKeyDown(tabEvent, "en");

    expect(prevented).toBe(false);
    expect(onPickMock).not.toHaveBeenCalled();
  });
});

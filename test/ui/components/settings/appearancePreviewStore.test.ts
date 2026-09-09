import { beforeEach, describe, expect, it } from "bun:test";
import { DEFAULT_APPEARANCE_DRAFT, useAppearancePreviewStore } from "@/frontend/common/stores/appearancePreviewStore";

function verifyColorSchemeDetection(
  attributeKey: "muiColorScheme" | "theme",
  expectedDarkness: { light: boolean; dark: boolean }
): void {
  document.documentElement.dataset[attributeKey] = "light";
  useAppearancePreviewStore.getState().enterCustomizeMode();
  expect(useAppearancePreviewStore.getState().isDark).toBe(expectedDarkness.light);

  useAppearancePreviewStore.getState().exitCustomizeMode();

  document.documentElement.dataset[attributeKey] = "dark";
  useAppearancePreviewStore.getState().enterCustomizeMode();
  expect(useAppearancePreviewStore.getState().isDark).toBe(expectedDarkness.dark);
  delete document.documentElement.dataset[attributeKey];
}

describe("appearancePreviewStore — isDark and defaultColorScheme sync", () => {
  beforeEach(() => {
    useAppearancePreviewStore.setState({
      draft: DEFAULT_APPEARANCE_DRAFT,
      isCustomizeMode: false,
      isDark: DEFAULT_APPEARANCE_DRAFT.defaultColorScheme === "dark",
      presetId: "default",
      hydrated: false,
      dirty: false,
      resetDialogOpen: false,
      past: [],
      future: [],
      lastPublished: null,
    });
    if (typeof document !== "undefined") {
      delete document.documentElement.dataset.muiColorScheme;
    }
  });

  it("initializes isDark based on DEFAULT_APPEARANCE_DRAFT.defaultColorScheme", () => {
    const isDark = useAppearancePreviewStore.getState().isDark;
    expect(isDark).toBe(DEFAULT_APPEARANCE_DRAFT.defaultColorScheme === "dark");
  });

  it("enterCustomizeMode uses document dataset muiColorScheme if present", () => {
    verifyColorSchemeDetection("muiColorScheme", { light: false, dark: true });
  });

  it("enterCustomizeMode falls back to draft.defaultColorScheme when dataset is unset", () => {
    delete document.documentElement.dataset.muiColorScheme;
    useAppearancePreviewStore.setState({
      draft: { ...DEFAULT_APPEARANCE_DRAFT, defaultColorScheme: "light" },
    });

    useAppearancePreviewStore.getState().enterCustomizeMode();
    expect(useAppearancePreviewStore.getState().isDark).toBe(false);
  });

  it("loadFromServer updates isDark based on draft.defaultColorScheme when not in customize mode", () => {
    useAppearancePreviewStore.getState().loadFromServer({
      ...DEFAULT_APPEARANCE_DRAFT,
      defaultColorScheme: "light",
    });

    expect(useAppearancePreviewStore.getState().isDark).toBe(false);
    expect(useAppearancePreviewStore.getState().hydrated).toBe(true);
  });

  it("enterCustomizeMode falls back to data-theme attribute when data-mui-color-scheme is missing", () => {
    verifyColorSchemeDetection("theme", { light: false, dark: true });
  });

  it("markPublished snapshots the published draft and is kept until the next customize session", () => {
    const published = { ...DEFAULT_APPEARANCE_DRAFT, siteName: "Published Name" };

    useAppearancePreviewStore.getState().markPublished(published);
    expect(useAppearancePreviewStore.getState().lastPublished).toBe(published);

    useAppearancePreviewStore.getState().exitCustomizeMode();
    expect(useAppearancePreviewStore.getState().lastPublished).toBe(published);

    useAppearancePreviewStore.getState().enterCustomizeMode();
    expect(useAppearancePreviewStore.getState().lastPublished).toBeNull();
  });

  it("exitCustomizeMode after a publish keeps the published colors as inline CSS vars instead of clearing", () => {
    document.documentElement.dataset.muiColorScheme = "dark";
    useAppearancePreviewStore.getState().enterCustomizeMode();

    useAppearancePreviewStore.getState().markPublished({
      ...DEFAULT_APPEARANCE_DRAFT,
      colors: {
        light: { primaryMain: "#111111", secondaryMain: "#222222" },
        dark: { primaryMain: "#333333", secondaryMain: "#444444" },
      },
    });
    useAppearancePreviewStore.getState().exitCustomizeMode();

    expect(useAppearancePreviewStore.getState().isCustomizeMode).toBe(false);
    expect(document.documentElement.style.getPropertyValue("--mui-palette-primary-main")).toBe("#333333");

    useAppearancePreviewStore.getState().exitCustomizeMode();
    delete document.documentElement.dataset.muiColorScheme;
  });
});

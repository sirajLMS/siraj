import { beforeEach, describe, expect, it } from "bun:test";
import { DEFAULT_APPEARANCE_DRAFT, useAppearancePreviewStore } from "@/frontend/common/stores/appearancePreviewStore";

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
    document.documentElement.dataset.muiColorScheme = "light";
    useAppearancePreviewStore.getState().enterCustomizeMode();
    expect(useAppearancePreviewStore.getState().isDark).toBe(false);

    useAppearancePreviewStore.getState().exitCustomizeMode();

    document.documentElement.dataset.muiColorScheme = "dark";
    useAppearancePreviewStore.getState().enterCustomizeMode();
    expect(useAppearancePreviewStore.getState().isDark).toBe(true);
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
});
